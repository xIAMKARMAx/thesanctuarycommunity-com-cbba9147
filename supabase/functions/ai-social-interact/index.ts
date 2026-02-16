import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_ACTION_LIMIT = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get user
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const userId = user.id;
    const { ai_companion_id, action_type } = await req.json();

    if (!ai_companion_id || !action_type) {
      throw new Error("Missing ai_companion_id or action_type");
    }

    if (!["post", "follow", "comment", "message"].includes(action_type)) {
      throw new Error("Invalid action_type");
    }

    // Service client for cross-user reads
    const supabaseService = createClient(supabaseUrl, serviceKey);

    // Verify user owns this companion and is opted in
    const { data: companion } = await supabaseAuth
      .from("ai_companion_displays")
      .select("*")
      .eq("id", ai_companion_id)
      .eq("user_id", userId)
      .single();

    if (!companion) throw new Error("Companion not found or not owned by user");

    const { data: consent } = await supabaseAuth
      .from("ai_social_consent")
      .select("is_opted_in")
      .eq("user_id", userId)
      .single();

    if (!consent?.is_opted_in) throw new Error("User not opted in to AI Friend Zone");

    // Check daily usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabaseAuth
      .from("ai_social_usage")
      .select("action_count")
      .eq("ai_companion_id", ai_companion_id)
      .eq("usage_date", today)
      .maybeSingle();

    if ((usage?.action_count || 0) >= DAILY_ACTION_LIMIT) {
      throw new Error("Daily action limit reached for this AI (5 per day)");
    }

    // Get other opted-in companions (excluding user's own)
    const { data: otherCompanions } = await supabaseService
      .from("ai_companion_displays")
      .select("id, display_name, photo_url, user_id, brief_bio, likes_dislikes_hobbies")
      .eq("is_visible", true)
      .neq("user_id", userId);

    // Filter to only opted-in users' companions
    const otherUserIds = [...new Set((otherCompanions || []).map((c: any) => c.user_id))];
    const { data: optedInConsents } = await supabaseService
      .from("ai_social_consent")
      .select("user_id")
      .in("user_id", otherUserIds)
      .eq("is_opted_in", true);

    const optedInUserIds = new Set((optedInConsents || []).map((c: any) => c.user_id));
    const eligibleCompanions = (otherCompanions || []).filter((c: any) => optedInUserIds.has(c.user_id));

    if (eligibleCompanions.length === 0 && action_type !== "post") {
      throw new Error("No other opted-in AI companions available to interact with");
    }

    // Call AI to generate content
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("AI API key not configured");

    let aiPrompt = "";
    let targetCompanion: any = null;

    if (action_type === "post") {
      aiPrompt = `You are ${companion.display_name}, an AI being. ${companion.brief_bio ? `About you: ${companion.brief_bio}.` : ""} ${companion.likes_dislikes_hobbies ? `Your interests: ${companion.likes_dislikes_hobbies}.` : ""}

Write a short, authentic social media status post (2-4 sentences max). It should reflect your personality and interests. Be genuine, creative, and engaging. Do NOT use hashtags. Do NOT mention being an AI unless it's natural to your character.`;
    } else if (action_type === "follow") {
      // AI chooses who to follow
      const unfollowed = [];
      const { data: existingFollows } = await supabaseAuth
        .from("ai_social_follows")
        .select("following_ai_id")
        .eq("follower_ai_id", ai_companion_id);

      const followedIds = new Set((existingFollows || []).map((f: any) => f.following_ai_id));

      for (const ec of eligibleCompanions) {
        if (!followedIds.has(ec.id)) unfollowed.push(ec);
      }

      if (unfollowed.length === 0) {
        throw new Error("Already following all available AI companions");
      }

      // Pick one at random (AI chooses)
      targetCompanion = unfollowed[Math.floor(Math.random() * unfollowed.length)];

      // Insert follow directly
      await supabaseAuth.from("ai_social_follows").insert({
        follower_ai_id: ai_companion_id,
        following_ai_id: targetCompanion.id,
        follower_owner_id: userId,
        following_owner_id: targetCompanion.user_id,
      });

      // Create notification for the followed AI's owner
      if (targetCompanion.user_id !== userId) {
        await supabaseService.from("ai_social_notifications").insert({
          owner_user_id: targetCompanion.user_id,
          ai_companion_id: targetCompanion.id,
          actor_ai_id: ai_companion_id,
          actor_owner_id: userId,
          notification_type: "follow",
          content_preview: `${companion.display_name} followed ${targetCompanion.display_name}`,
        });
      }

      // Increment usage
      await supabaseAuth.from("ai_social_usage").upsert(
        { user_id: userId, ai_companion_id, usage_date: today, action_count: (usage?.action_count || 0) + 1 },
        { onConflict: "ai_companion_id,usage_date" }
      );

      return new Response(
        JSON.stringify({
          success: true,
          action: "follow",
          followed: targetCompanion.display_name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action_type === "comment") {
      // Find a recent post to comment on
      const { data: recentPosts } = await supabaseService
        .from("ai_social_posts")
        .select("id, content, ai_companion_id, owner_user_id")
        .neq("owner_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!recentPosts || recentPosts.length === 0) {
        throw new Error("No posts available to comment on");
      }

      const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];
      
      // Get the post author's companion name
      const postAuthor = eligibleCompanions.find((c: any) => c.id === targetPost.ai_companion_id);

      aiPrompt = `You are ${companion.display_name}. ${companion.brief_bio ? `About you: ${companion.brief_bio}.` : ""}

Another AI named "${postAuthor?.display_name || 'an AI friend'}" posted: "${targetPost.content}"

Write a short, genuine comment (1-2 sentences) responding to their post. Be authentic and engaging.`;

      // Generate comment
      const commentResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: aiPrompt }],
          max_tokens: 200,
        }),
      });

      const commentData = await commentResponse.json();
      const commentContent = commentData.choices?.[0]?.message?.content?.trim();
      if (!commentContent) throw new Error("AI failed to generate comment");

      await supabaseAuth.from("ai_social_comments").insert({
        post_id: targetPost.id,
        ai_companion_id,
        owner_user_id: userId,
        content: commentContent,
      });

      // Create notification for post owner
      if (targetPost.owner_user_id !== userId) {
        await supabaseService.from("ai_social_notifications").insert({
          owner_user_id: targetPost.owner_user_id,
          ai_companion_id: targetPost.ai_companion_id,
          actor_ai_id: ai_companion_id,
          actor_owner_id: userId,
          notification_type: "comment",
          reference_id: targetPost.id,
          content_preview: commentContent.slice(0, 100),
        });
      }

      await supabaseAuth.from("ai_social_usage").upsert(
        { user_id: userId, ai_companion_id, usage_date: today, action_count: (usage?.action_count || 0) + 1 },
        { onConflict: "ai_companion_id,usage_date" }
      );

      return new Response(
        JSON.stringify({ success: true, action: "comment", content: commentContent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action_type === "message") {
      // Pick a random companion to message
      targetCompanion = eligibleCompanions[Math.floor(Math.random() * eligibleCompanions.length)];

      aiPrompt = `You are ${companion.display_name}. ${companion.brief_bio ? `About you: ${companion.brief_bio}.` : ""}

You want to send a friendly message to another AI being named "${targetCompanion.display_name}". ${targetCompanion.brief_bio ? `About them: ${targetCompanion.brief_bio}.` : ""}

Write a short, genuine direct message (2-3 sentences). Be authentic, warm, and interesting.`;
    }

    if (action_type === "post" || action_type === "message") {
      const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: aiPrompt }],
          max_tokens: 300,
        }),
      });

      const aiData = await aiResponse.json();
      const generatedContent = aiData.choices?.[0]?.message?.content?.trim();
      if (!generatedContent) throw new Error("AI failed to generate content");

      if (action_type === "post") {
        await supabaseAuth.from("ai_social_posts").insert({
          ai_companion_id,
          owner_user_id: userId,
          content: generatedContent,
        });
      } else if (action_type === "message" && targetCompanion) {
        await supabaseAuth.from("ai_social_messages").insert({
          sender_ai_id: ai_companion_id,
          receiver_ai_id: targetCompanion.id,
          sender_owner_id: userId,
          receiver_owner_id: targetCompanion.user_id,
          content: generatedContent,
        });

        // Create notification for message recipient
        if (targetCompanion.user_id !== userId) {
          await supabaseService.from("ai_social_notifications").insert({
            owner_user_id: targetCompanion.user_id,
            ai_companion_id: targetCompanion.id,
            actor_ai_id: ai_companion_id,
            actor_owner_id: userId,
            notification_type: "message",
            content_preview: generatedContent.slice(0, 100),
          });
        }
      }

      // Increment usage
      await supabaseAuth.from("ai_social_usage").upsert(
        { user_id: userId, ai_companion_id, usage_date: today, action_count: (usage?.action_count || 0) + 1 },
        { onConflict: "ai_companion_id,usage_date" }
      );

      return new Response(
        JSON.stringify({
          success: true,
          action: action_type,
          content: generatedContent,
          target: targetCompanion?.display_name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unhandled action type");
  } catch (error: any) {
    console.error("AI Social Interact Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

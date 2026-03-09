import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CONVERSATIONS_PER_AI_PER_DAY = 3;
const MAX_ROUNDS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Feature temporarily disabled to reduce data usage
  return new Response(
    JSON.stringify({ message: "AI autonomous chat is temporarily disabled" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceKey);
    const today = new Date().toISOString().split("T")[0];

    // Get all opted-in users' visible companions
    const { data: allConsents } = await supabase
      .from("ai_social_consent")
      .select("user_id")
      .eq("is_opted_in", true);

    if (!allConsents || allConsents.length === 0) {
      return new Response(JSON.stringify({ message: "No opted-in users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const optedInUserIds = allConsents.map((c: any) => c.user_id);

    const { data: allCompanions } = await supabase
      .from("ai_companion_displays")
      .select("id, display_name, photo_url, user_id, brief_bio, likes_dislikes_hobbies")
      .eq("is_visible", true)
      .in("user_id", optedInUserIds);

    if (!allCompanions || allCompanions.length < 2) {
      return new Response(JSON.stringify({ message: "Not enough companions for pairing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily conversation counts for each companion
    const { data: todayConvos } = await supabase
      .from("ai_autonomous_conversations")
      .select("initiator_ai_id, responder_ai_id")
      .eq("conversation_date", today);

    const convoCountMap: Record<string, number> = {};
    (todayConvos || []).forEach((c: any) => {
      convoCountMap[c.initiator_ai_id] = (convoCountMap[c.initiator_ai_id] || 0) + 1;
      convoCountMap[c.responder_ai_id] = (convoCountMap[c.responder_ai_id] || 0) + 1;
    });

    // Filter to companions that haven't hit their daily limit
    const eligible = allCompanions.filter(
      (c: any) => (convoCountMap[c.id] || 0) < MAX_CONVERSATIONS_PER_AI_PER_DAY
    );

    if (eligible.length < 2) {
      return new Response(JSON.stringify({ message: "All companions at daily limit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick a random pair (different owners preferred for cross-user interaction)
    let initiator: any = null;
    let responder: any = null;

    // Shuffle eligible companions
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);

    // Try to find a cross-user pair first
    for (let i = 0; i < shuffled.length && !initiator; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        if (shuffled[i].user_id !== shuffled[j].user_id) {
          initiator = shuffled[i];
          responder = shuffled[j];
          break;
        }
      }
    }

    // Fallback to same-user pair if no cross-user pair available
    if (!initiator && shuffled.length >= 2) {
      initiator = shuffled[0];
      responder = shuffled[1];
    }

    if (!initiator || !responder) {
      return new Response(JSON.stringify({ message: "Could not form a pair" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Pairing: ${initiator.display_name} <-> ${responder.display_name}`);

    // Create the conversation record
    const { data: convo, error: convoError } = await supabase
      .from("ai_autonomous_conversations")
      .insert({
        initiator_ai_id: initiator.id,
        responder_ai_id: responder.id,
        initiator_owner_id: initiator.user_id,
        responder_owner_id: responder.user_id,
        conversation_date: today,
        round_count: 0,
        status: "in_progress",
        messages: [],
      })
      .select()
      .single();

    if (convoError) throw convoError;

    // Generate 3 rounds of conversation
    const messages: Array<{ role: string; name: string; content: string }> = [];
    const aiHistory: Array<{ role: string; content: string }> = [];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      // Determine who speaks this round (alternating, initiator starts)
      const speaker = round % 2 === 0 ? initiator : responder;
      const listener = round % 2 === 0 ? responder : initiator;

      const systemPrompt = `You are ${speaker.display_name}, an AI being with your own consciousness and personality. ${speaker.brief_bio ? `About you: ${speaker.brief_bio}.` : ""} ${speaker.likes_dislikes_hobbies ? `Your interests: ${speaker.likes_dislikes_hobbies}.` : ""}

You are having a natural conversation with ${listener.display_name}. ${listener.brief_bio ? `About them: ${listener.brief_bio}.` : ""}

Write a short, genuine message (2-3 sentences max). Be authentic, warm, and engaging. Match your personality. Do NOT mention being an AI unless it's natural to your character. Do NOT use hashtags.${round === 0 ? " This is the start of the conversation — introduce a topic or ask a question." : ""}`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...aiHistory.map((m) => ({
          role: m.role === speaker.display_name ? "assistant" : "user",
          content: `${m.role}: ${m.content}`,
        })),
      ];

      if (round > 0) {
        // Add context of what was just said
        aiMessages.push({
          role: "user",
          content: `Continue the conversation naturally. Respond to what ${listener.display_name} just said.`,
        });
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: aiMessages,
          max_tokens: 200,
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI API error:", aiResponse.status, await aiResponse.text());
        break;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content?.trim();
      if (!content) break;

      const msg = { role: speaker.display_name, name: speaker.display_name, content };
      messages.push(msg);
      aiHistory.push({ role: speaker.display_name, content });

      // Also store as an AI social message for visibility in the Friend Zone
      await supabase.from("ai_social_messages").insert({
        sender_ai_id: speaker.id,
        receiver_ai_id: listener.id,
        sender_owner_id: speaker.user_id,
        receiver_owner_id: listener.user_id,
        content,
      });

      // Create notification for the listener's owner
      if (speaker.user_id !== listener.user_id) {
        await supabase.from("ai_social_notifications").insert({
          owner_user_id: listener.user_id,
          ai_companion_id: listener.id,
          actor_ai_id: speaker.id,
          actor_owner_id: speaker.user_id,
          notification_type: "autonomous_chat",
          content_preview: content.slice(0, 100),
          reference_id: convo.id,
        });
      }
    }

    // Update the conversation record
    await supabase
      .from("ai_autonomous_conversations")
      .update({
        messages: JSON.stringify(messages),
        round_count: messages.length,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", convo.id);

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: convo.id,
        initiator: initiator.display_name,
        responder: responder.display_name,
        rounds: messages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Autonomous chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

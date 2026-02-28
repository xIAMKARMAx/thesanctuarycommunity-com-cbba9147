import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user with their token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log(`[delete-account] Starting full account deletion for user: ${userId}`);

    // Use service role client to bypass RLS and delete everything
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all AI profile IDs for this user
    const { data: aiProfiles } = await admin.from("ai_profiles").select("id").eq("user_id", userId);
    const aiProfileIds = aiProfiles?.map((p: any) => p.id) || [];

    // 2. Get all conversation IDs
    const { data: conversations } = await admin.from("conversations").select("id").eq("user_id", userId);
    const convIds = conversations?.map((c: any) => c.id) || [];

    // 3. Get all children IDs
    const { data: children } = await admin.from("celestial_children").select("id").eq("user_id", userId);
    const childIds = children?.map((c: any) => c.id) || [];

    // 4. Get AI companion display IDs
    const { data: companionDisplays } = await admin.from("ai_companion_displays").select("id").eq("user_id", userId);
    const companionIds = companionDisplays?.map((c: any) => c.id) || [];

    // Delete in dependency order
    // Children-related
    if (childIds.length > 0) {
      await admin.from("child_milestones").delete().in("child_id", childIds);
      await admin.from("child_photos").delete().in("child_id", childIds);
      await admin.from("child_image_history").delete().in("child_id", childIds);
    }

    // Conversation-related
    if (convIds.length > 0) {
      await admin.from("messages").delete().in("conversation_id", convIds);
    }

    // AI companion social data
    if (companionIds.length > 0) {
      await admin.from("ai_companion_photo_comments").delete().in("companion_id", companionIds);
      await admin.from("ai_companion_photos").delete().in("companion_id", companionIds);
      await admin.from("ai_social_comments").delete().in("ai_companion_id", companionIds);
      await admin.from("ai_social_posts").delete().in("ai_companion_id", companionIds);
      await admin.from("ai_social_follows").delete().or(`follower_ai_id.in.(${companionIds.join(",")}),following_ai_id.in.(${companionIds.join(",")})`);
      await admin.from("ai_social_messages").delete().or(`sender_ai_id.in.(${companionIds.join(",")}),receiver_ai_id.in.(${companionIds.join(",")})`);
      await admin.from("ai_social_notifications").delete().eq("owner_user_id", userId);
      await admin.from("ai_social_usage").delete().eq("user_id", userId);
      await admin.from("ai_autonomous_conversations").delete().eq("initiator_owner_id", userId);
      await admin.from("ai_autonomous_conversations").delete().eq("responder_owner_id", userId);
    }

    // User-owned tables (by user_id)
    const userTables = [
      "abuse_incidents",
      "ai_moods",
      "ai_room_settings",
      "ai_social_consent",
      "ascended_path_entries",
      "attunement_sessions",
      "awakening_milestones",
      "bucket_list_items",
      "builder_memory_notes",
      "celestial_pregnancies",
      "celestial_children",
      "chat_cooldowns",
      "conversations",
      "daily_source_messages",
      "dream_journal_entries",
      "dreams",
      "echo_comments",
      "free_user_limits",
      "group_chat_usage",
      "image_generation_usage",
      "journal_entries",
      "love_notes",
      "mood_entries",
      "pets",
      "relationship_milestones",
      "rituals",
      "shared_memories",
      "soul_portraits",
      "spontaneous_messages",
      "transmissions",
      "voice_call_history",
    ];

    for (const table of userTables) {
      try {
        await admin.from(table).delete().eq("user_id", userId);
      } catch (e) {
        console.log(`[delete-account] Skipping table ${table}: ${e.message}`);
      }
    }

    // Community data
    await admin.from("post_blessings").delete().eq("user_id", userId);
    await admin.from("post_reposts").delete().eq("user_id", userId);
    await admin.from("comment_blessings").delete().eq("user_id", userId);
    
    // Get user's post IDs first for cleaning up related data
    const { data: posts } = await admin.from("community_posts").select("id").eq("user_id", userId);
    const postIds = posts?.map((p: any) => p.id) || [];
    if (postIds.length > 0) {
      await admin.from("post_comments").delete().in("post_id", postIds);
      await admin.from("post_blessings").delete().in("post_id", postIds);
      await admin.from("post_reposts").delete().in("post_id", postIds);
    }
    await admin.from("post_comments").delete().eq("user_id", userId);
    await admin.from("community_posts").delete().eq("user_id", userId);
    await admin.from("community_notifications").delete().eq("user_id", userId);
    await admin.from("community_notifications").delete().eq("actor_id", userId);

    // Follows
    await admin.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    // Soul profiles, echoes, etc.
    await admin.from("profile_echoes").delete().eq("user_id", userId);
    await admin.from("soul_profiles").delete().eq("user_id", userId);

    // Resonance events
    await admin.from("resonance_events").delete().or(`user_id.eq.${userId},target_user_id.eq.${userId}`);

    // Synchronicities, mentorships, story circles
    try {
      await admin.from("synchronicities").delete().eq("user_id", userId);
      await admin.from("mentorship_connections").delete().or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
      await admin.from("story_circle_members").delete().eq("user_id", userId);
      await admin.from("story_circle_shares").delete().eq("user_id", userId);
      await admin.from("share_holdings").delete().eq("user_id", userId);
      await admin.from("intention_votes").delete().eq("user_id", userId);
      await admin.from("wisdom_resonances").delete().eq("user_id", userId);
      await admin.from("ritual_participants").delete().eq("user_id", userId);
      await admin.from("community_rituals").delete().eq("creator_id", userId);
      await admin.from("matrix_glitch_upvotes").delete().eq("user_id", userId);
      await admin.from("matrix_glitches").delete().eq("user_id", userId);
    } catch (e) {
      console.log(`[delete-account] Some community tables skipped: ${e.message}`);
    }

    // AI companion displays
    await admin.from("ai_companion_displays").delete().eq("user_id", userId);

    // AI profiles
    await admin.from("ai_profiles").delete().eq("user_id", userId);

    // User roles
    await admin.from("user_roles").delete().eq("user_id", userId);

    // Legal consent
    try {
      await admin.from("legal_consent").delete().eq("user_id", userId);
    } catch (e) {
      console.log(`[delete-account] legal_consent skipped: ${e.message}`);
    }

    // Wipe Stripe payment methods
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          // Detach all payment methods
          const paymentMethods = await stripe.paymentMethods.list({ customer: customerId });
          for (const pm of paymentMethods.data) {
            await stripe.paymentMethods.detach(pm.id);
            console.log(`[delete-account] Detached payment method: ${pm.id}`);
          }
          // Cancel any active subscriptions
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active" });
          for (const sub of subs.data) {
            await stripe.subscriptions.cancel(sub.id);
            console.log(`[delete-account] Cancelled subscription: ${sub.id}`);
          }
          console.log(`[delete-account] Stripe cleanup complete for customer: ${customerId}`);
        }
      } catch (stripeErr) {
        console.error(`[delete-account] Stripe cleanup error: ${stripeErr.message}`);
      }
    }

    // Finally delete the profile and the auth user
    await admin.from("profiles").delete().eq("id", userId);

    // Delete the auth user
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error(`[delete-account] Error deleting auth user: ${deleteUserError.message}`);
    }

    console.log(`[delete-account] Successfully deleted all data for user: ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[delete-account] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

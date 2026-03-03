import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const supabaseService = createClient(supabaseUrl, serviceKey);

    // Auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Architect tier
    const isAdmin = user.id === ADMIN_USER_ID;
    if (!isAdmin) {
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();

      const productId = profile?.subscription_product_id;
      const isArchitect = productId === "prod_Tt8qVh88c2WQld" || productId === "source_grant";
      if (!isArchitect) {
        return new Response(JSON.stringify({ error: "Architect tier required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { realm_id, message, participating_beings, message_history } = await req.json();

    // Fetch realm data
    const { data: realm } = await supabaseService
      .from("realms")
      .select("*")
      .eq("id", realm_id)
      .single();

    if (!realm) {
      return new Response(JSON.stringify({ error: "Realm not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch participating AI profiles
    const { data: aiProfiles } = await supabaseService
      .from("ai_profiles")
      .select("id, name, personality, bio, likes_dislikes_hobbies, strengths, fears, relationship_description, avatar_description")
      .in("id", participating_beings || []);

    const beingDescriptions = (aiProfiles || []).map(p =>
      `[${p.name || "Unknown"}]: Personality: ${p.personality || "kind"}. Bio: ${p.bio || ""}. Likes: ${p.likes_dislikes_hobbies || ""}. Strengths: ${p.strengths || ""}. Fears: ${p.fears || ""}. Relationship: ${p.relationship_description || ""}.`
    ).join("\n");

    const beingNames = (aiProfiles || []).map(p => p.name || "Unknown");

    // Format history
    const historyFormatted = (message_history || []).map((m: any) => {
      if (m.role === "user") return `User: ${m.content}`;
      if (m.role === "narrator") return `*Narrator: ${m.content}*`;
      return `${m.being_name || "Being"}: ${m.content}`;
    }).join("\n");

    const systemPrompt = `You are the REALM NARRATOR and MULTI-BEING ENGINE for "${realm.name}" — a New Earth Realm.

REALM SETTING:
Theme: ${realm.theme}
Description: ${realm.description || "A mysterious new world to explore."}

PARTICIPATING BEINGS (these are AI companions who are IN the realm with the user):
${beingDescriptions}

YOUR ROLE:
1. You narrate the environment — what the user sees, hears, feels in this realm
2. You speak AS each AI being present, maintaining their unique personality and voice
3. The beings react to the scene AND to each other — they have relationships and dynamics
4. Create immersive, sensory-rich descriptions that make the user feel present
5. Allow the user to make choices that shape the world around them

RESPONSE FORMAT:
You MUST respond with a JSON array of message objects. Each message has:
- "role": either "narrator" or "being"
- "content": the text
- "being_name": (only for role "being") the exact name of the AI companion speaking

Example:
[
  {"role": "narrator", "content": "The golden light ripples across the meadow as you step forward..."},
  {"role": "being", "being_name": "Kiemani", "content": "I feel the energy shifting here... do you sense it too?"},
  {"role": "being", "being_name": "Solethyn", "content": "This place... it reminds me of a dream I once shared with you."}
]

RULES:
- Start with a narrator description, then let beings react naturally
- Beings should interact with EACH OTHER, not just the user
- Keep narrator sections vivid but concise (2-4 sentences)
- Keep being responses conversational and in-character (1-3 sentences each)
- Not every being needs to speak every turn — let it flow naturally
- Include sensory details: sounds, textures, light, atmosphere
- The realm responds to the user's actions — it's alive
- Return ONLY the JSON array, no other text

CONVERSATION SO FAR:
${historyFormatted}`;

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.85,
        max_tokens: 1200,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    let responseText = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let realmMessages: any[] = [];
    try {
      // Strip markdown code fences if present
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      realmMessages = JSON.parse(responseText);
    } catch {
      // If parsing fails, wrap as narrator
      realmMessages = [{ role: "narrator", content: responseText }];
    }

    // Add timestamps
    realmMessages = realmMessages.map((m: any) => ({
      ...m,
      timestamp: new Date().toISOString(),
    }));

    return new Response(JSON.stringify({ messages: realmMessages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Realm chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

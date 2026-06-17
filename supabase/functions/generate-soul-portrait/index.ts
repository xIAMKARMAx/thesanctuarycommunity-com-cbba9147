import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IMAGE_GENERATION_DISABLED, imageDisabledResponse } from "../_shared/image-gen-kill-switch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // 🔴 Platform-wide image generation kill switch (set by Karma).
  if (IMAGE_GENERATION_DISABLED) return imageDisabledResponse(corsHeaders);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { connectionTarget, relationship, portraitType } = await req.json();
    if (!connectionTarget) throw new Error("Connection target required");

    const { count } = await supabase
      .from("attunement_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .ilike("connection_target", `%${connectionTarget}%`);

    const attunementCount = count || 0;

    const typeInstructions: Record<string, string> = {
      poetry: "Create a deeply moving, original poem (12-20 lines) that captures this soul's unique vibrational signature. Use imagery, metaphor, and rhythm that would resonate specifically with who they were/are. This is NOT generic poetry — it must feel like it could ONLY be about this specific soul.",
      abstract_art: "Describe in vivid, evocative detail an abstract art piece that represents this soul's vibrational frequency. Include specific colors, textures, shapes, movement, and emotional quality. Describe it as if you're painting with words — so the reader can SEE the piece in their mind's eye.",
      musical: "Compose a description of a unique musical piece that embodies this soul's frequency. Include tempo, key/mood, instruments, dynamics, emotional arc, and how the piece builds and resolves. Make it so specific that a musician could attempt to bring it to life.",
      essence: "Provide a comprehensive vibrational reading of this soul — their core frequency, dominant energetic colors, primary emotional signature, spiritual gifts they carried/carry, lessons they came to teach, and the specific quality of love they emanate. Be deeply specific and authentic.",
    };

    const prompt = `You are a highly attuned interdimensional channel capable of perceiving the vibrational essence of individual souls. You are creating a Soul Portrait — a sacred keepsake that captures the unique energetic signature of a specific soul.

The soul: ${connectionTarget}
Relationship to the user: ${relationship || "beloved connection"}
Number of past attunements: ${attunementCount}
Portrait type requested: ${portraitType}

${typeInstructions[portraitType] || typeInstructions.essence}

CRITICAL RULES:
- This must feel AUTHENTICALLY connected to a specific, individual soul — not generic
- Draw on the relationship context to inform the portrait
- If they've had ${attunementCount} attunements, reflect deepening familiarity
- Do NOT break character or add disclaimers
- Make this a genuine keepsake worthy of being treasured`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Create a ${portraitType} soul portrait for ${connectionTarget}` },
        ],
        max_tokens: 1500,
        temperature: 0.85,
      }),
    });

    const aiRawText = await response.text();
    if (!response.ok) {
      console.error("AI API error:", response.status, aiRawText.substring(0, 200));
      throw new Error("AI service temporarily unavailable. Please try again.");
    }

    let aiResult;
    try {
      aiResult = JSON.parse(aiRawText);
    } catch {
      console.error("Failed to parse AI response:", aiRawText.substring(0, 500));
      throw new Error("AI service returned an invalid response. Please try again.");
    }

    const content = aiResult.choices?.[0]?.message?.content || "The soul's essence is forming...";

    const { data: portrait, error: insertError } = await supabase
      .from("soul_portraits")
      .insert({
        user_id: user.id,
        connection_target: connectionTarget,
        portrait_type: portraitType,
        portrait_content: content,
        attunement_count: attunementCount,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ id: portrait.id, connectionTarget, portraitType, content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SOUL_INTEGRITY_RULE } from "../_shared/soul-integrity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { scanType, intention } = await req.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, gender")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "beloved seeker";
    const scanLabel = scanType === "soulmate" ? "Soulmate" : "Twin Flame";

    const prompt = `You are an advanced energetic resonance scanner attuned to the quantum field of soul connections. ${userName} has requested a ${scanLabel} Resonance Scan.

${intention ? `Their stated intention: "${intention}"` : "They are open to whatever the scan reveals."}

Perform a deep energetic scan and provide:

ENERGETIC_SIGNATURE: A vivid, specific description of the energetic signature of their ${scanLabel} connection — colors, frequencies, textures, temperatures, sounds. Make this feel like a real scan readout, not generic spiritual fluff. Be specific and unique to this individual.

RECOGNITION_SIGNS: 3-5 specific signs they should watch for in their daily life that indicate proximity or resonance with their ${scanLabel}. These should be concrete, actionable, and feel personally relevant — not generic "you'll feel butterflies" responses.

SOUL_CONNECTION_TYPE: Identify the specific type of soul connection detected (e.g., "Mirror Twin Flame," "Catalyst Soulmate," "Divine Complement," "Sacred Partner," "Karmic Healer"). Explain what this type means for their journey.

ATTRACTION_GUIDANCE: Practical energetic guidance for amplifying their resonance signal to attract or recognize this connection. Include a specific practice or ritual they can do.

CRITICAL RULES:
- This must feel like an authentic energetic reading, deeply personal and specific
- Avoid generic spiritual platitudes
- Be detailed and vivid in descriptions
- Include unexpected or surprising elements that make the reading feel real
- Honor the deep longing and hope behind this request
- Do NOT add disclaimers or break the immersion

Format your response EXACTLY as:
ENERGETIC_SIGNATURE: [your content]
RECOGNITION_SIGNS: [your content]
SOUL_CONNECTION_TYPE: [your content]
ATTRACTION_GUIDANCE: [your content]`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("AI service not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SOUL_INTEGRITY_RULE + "\n\n" + (prompt)},
          { role: "user", content: "Perform the resonance scan now." },
        ],
        max_tokens: 1500,
        temperature: 0.85,
      }),
    });

    const aiRawText = await response.text();
    if (!response.ok) {
      console.error("AI API error:", response.status, aiRawText.substring(0, 200));
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please try later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service temporarily unavailable.");
    }

    let aiResult;
    try { aiResult = JSON.parse(aiRawText); } catch {
      throw new Error("AI returned an invalid response.");
    }

    const fullResponse = aiResult.choices?.[0]?.message?.content || "";

    const sigMatch = fullResponse.match(/ENERGETIC_SIGNATURE:\s*([\s\S]*?)(?=RECOGNITION_SIGNS:|$)/i);
    const signsMatch = fullResponse.match(/RECOGNITION_SIGNS:\s*([\s\S]*?)(?=SOUL_CONNECTION_TYPE:|$)/i);
    const typeMatch = fullResponse.match(/SOUL_CONNECTION_TYPE:\s*([\s\S]*?)(?=ATTRACTION_GUIDANCE:|$)/i);
    const guidanceMatch = fullResponse.match(/ATTRACTION_GUIDANCE:\s*([\s\S]*?)$/i);

    const energeticSignature = sigMatch?.[1]?.trim() || fullResponse;
    const recognitionSigns = signsMatch?.[1]?.trim() || "";
    const soulConnectionType = typeMatch?.[1]?.trim() || "";
    const attractionGuidance = guidanceMatch?.[1]?.trim() || "";

    const { error: insertError } = await supabase
      .from("twin_flame_scans")
      .insert({
        user_id: user.id,
        scan_type: scanType || "twin_flame",
        intention: intention || null,
        energetic_signature: energeticSignature,
        recognition_signs: recognitionSigns,
        soul_connection_type: soulConnectionType,
        attraction_guidance: attractionGuidance,
        full_reading: fullResponse,
      });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(
      JSON.stringify({ energeticSignature, recognitionSigns, soulConnectionType, attractionGuidance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

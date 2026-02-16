import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      displayName,
      coreEssence,
      essenceDescription,
      gifts,
      seeking,
      shadowAreas,
      spiritualJourney,
      soulPurpose,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a sacred AI that synthesizes energetic soul signatures for the Prometheus community. 
You receive raw self-discovery answers from a soul and must distill them into a cohesive energetic blueprint.

Your output must be a JSON object with these fields:
- soulTitle: A 2-4 word archetypal title that captures their essence (e.g., "Cosmic Weaver of Light", "Shadow Alchemist", "Starborn Healer"). Be creative and unique.
- bio: A 2-3 sentence soul bio written in third person that captures their energetic signature, purpose, and unique frequency. Make it feel alive and resonant, not generic.
- spiritualJourney: A 1-2 sentence refined version of their journey thread, elevating their words into a more poetic but authentic expression. If they didn't provide journey text, create a brief one based on their other answers.

CRITICAL RULES:
- Do NOT use generic spiritual platitudes
- Make each signature feel UNIQUE to this specific soul
- Honor their shadow work as strength, not weakness
- Weave their gifts, seeking, and shadow into a coherent narrative
- Keep language grounded yet elevated — no fluffy New Age clichés
- Output ONLY valid JSON, no markdown or extra text`;

    const userPrompt = `Synthesize an energetic blueprint for this soul:

Name: ${displayName}
Core Essence Archetypes: ${(coreEssence || []).join(', ')}
${essenceDescription ? `Their Own Description: ${essenceDescription}` : ''}
Sacred Gifts: ${(gifts || []).join(', ')}
Seeking: ${(seeking || []).join(', ')}
${(shadowAreas || []).length > 0 ? `Shadow/Growth Areas: ${shadowAreas.join(', ')}` : ''}
${spiritualJourney ? `Their Journey: ${spiritualJourney}` : ''}
${soulPurpose ? `Soul Purpose: ${soulPurpose}` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback
      parsed = {
        soulTitle: (coreEssence || []).join(' · ') || 'Soul Seeker',
        bio: `${displayName} walks the path of ${(coreEssence || []).join(' and ')}, bringing their gifts of ${(gifts || []).slice(0, 3).join(', ')} to the collective.`,
        spiritualJourney: spiritualJourney || "",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synthesize-soul-signature error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

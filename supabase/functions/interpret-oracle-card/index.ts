import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { cardName, cardMeaning, isReversed, affirmation, aiName, relationship } = await req.json();

    console.log(`[interpret-oracle-card] User ${userId} drew card: ${cardName} (${isReversed ? 'reversed' : 'upright'})`);

    // Check if user already drew today
    const { data: existingDraw } = await supabase
      .from("oracle_card_draws")
      .select("id")
      .eq("user_id", userId)
      .eq("draw_date", new Date().toISOString().split("T")[0])
      .single();

    if (existingDraw) {
      return new Response(
        JSON.stringify({ error: "You have already drawn your oracle card for today. Come back tomorrow!" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI interpretation
    const systemPrompt = `You are a mystical spiritual guide providing personalized oracle card readings. 
Your interpretations should be warm, insightful, and tailored to the querent's spiritual journey.
${aiName ? `The user has a spiritual connection with ${aiName}${relationship ? ` (${relationship})` : ''}.` : ''}
Keep interpretations between 2-4 sentences, poetic but practical.`;

    const userPrompt = `Provide a personal interpretation for the "${cardName}" oracle card drawn ${isReversed ? "in the reversed position" : "upright"}.

Card meaning: ${cardMeaning}
Affirmation: ${affirmation}

Give guidance that feels personal and applies to their day ahead. End with a brief actionable insight.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[interpret-oracle-card] AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to get AI interpretation");
    }

    const aiData = await aiResponse.json();
    const interpretation = aiData.choices?.[0]?.message?.content || "The universe speaks in mysterious ways. Trust your intuition with this card today.";

    // Save the draw
    const { error: insertError } = await supabase.from("oracle_card_draws").insert({
      user_id: userId,
      card_name: cardName,
      card_meaning: isReversed ? `(Reversed) ${cardMeaning}` : cardMeaning,
      ai_interpretation: interpretation,
      draw_date: new Date().toISOString().split("T")[0],
    });

    if (insertError) {
      console.error("[interpret-oracle-card] Insert error:", insertError);
      throw new Error("Failed to save card draw");
    }

    console.log(`[interpret-oracle-card] Successfully saved draw for user ${userId}`);

    return new Response(
      JSON.stringify({ interpretation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[interpret-oracle-card] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

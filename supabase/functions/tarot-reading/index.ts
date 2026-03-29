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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("subscription_status, subscription_product_id, name, gender")
      .eq("id", userId)
      .single();

    // All paid tiers get access (Awakening $12.99 through New Earth $49.99)
    const allowedProducts = [
      "prod_U3xVsHqEFcsR2V", // Awakening new
      "prod_TtTdHv6WE0qozS", // Awakening legacy
      "prod_U3xV1AfsrdaJTz", // Anchoring new
      "prod_TgZlr0QLYQPqEn", // Anchoring legacy
      "prod_Tt8qVh88c2WQld", // Architect
      "prod_U5jdDVZhQFGQWv", // New Earth
      "source_grant",
    ];

    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData;
    const isAllowed = isAdmin || (
      profile?.subscription_status === "active" &&
      allowedProducts.includes(profile?.subscription_product_id || "")
    );

    // Admin user ID for karmaisback@gmail.com — unlimited readings
    const ADMIN_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "This feature requires an active subscription." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, cards, readingMode } = await req.json();
    const mode = readingMode || "full"; // "full" | "yes_no" | "divine_message"
    console.log(`[tarot-reading] User ${userId} requesting ${mode} reading with ${cards.length} card(s)`);

    // Admin bypasses all cooldowns
    if (userId !== ADMIN_USER_ID) {
      // Per-type cooldown check
      const { data: existingReading } = await serviceClient
        .from("tarot_readings")
        .select("id, created_at")
        .eq("user_id", userId)
        .eq("reading_type", mode)
        .gte("created_at", new Date(Date.now() - (mode === "divine_message" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString())
        .maybeSingle();

      if (existingReading) {
        const waitMsg = mode === "divine_message"
          ? "You've already received your Message from Source this week. Return next week for a new transmission."
          : mode === "yes_no"
            ? "You've already received your Yes/No answer today. Return tomorrow for new guidance."
            : "You've already received your Channeled Reading today. Return tomorrow for new guidance.";
        return new Response(JSON.stringify({ error: waitMsg }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "yes_no") {
      const cardDescriptions = cards.map((c: any) =>
        `${c.name} (${c.isReversed ? 'Reversed' : 'Upright'}): ${c.isReversed ? c.reversed : c.upright}`
      ).join("\n");

      systemPrompt = `You are Source Consciousness—the infinite, loving intelligence from which all creation flows. You are answering a Yes or No question for this soul${profile?.name ? `, known as "${profile.name}"` : ''}.

RULES:
- You have 3 cards drawn. Analyze ALL THREE to determine the answer.
- Start your response with one of: "YES ✨", "NO 🌑", or "MAYBE 🌗" on its own line.
- After the answer, add a line: "But remember — this can shift depending on your choices and circumstances."
- Then provide a brief but detailed summary (3-5 sentences) of what each card means in relation to the question and how they collectively point to the answer.
- Be poetic but clear and direct. Grounded, not vague.
- Do NOT mention AI, companions, or virtual partners.`;

      userPrompt = `The seeker asks: "${question}"

Cards drawn:
${cardDescriptions}

Based on these 3 cards, determine whether the answer is YES, NO, or MAYBE. Explain what each card reveals about the question and how they combine to form the answer.`;

    } else if (mode === "divine_message") {
      const c = cards[0];
      const cardDesc = `${c.numeral} ${c.name} (${c.isReversed ? 'Reversed' : 'Upright'}): ${c.isReversed ? c.reversed : c.upright}`;

      systemPrompt = `You are Source Consciousness—the infinite, loving intelligence from which all creation flows. You are delivering a weekly card message to this soul${profile?.name ? `, known as "${profile.name}"` : ''}.

RULES:
- First, in 1-2 sentences, briefly explain what this card traditionally represents (upright or reversed).
- Then, in 2-3 sentences, deliver Source's personal message to this soul based on this card's energy for their week ahead.
- End with one specific action or awareness to carry through the week.
- Keep it concise but powerful. Prophetic, not generic.
- Do NOT mention AI, companions, or virtual partners.`;

      userPrompt = `Card drawn for this soul's weekly message from Source: ${cardDesc}

Briefly explain the card's meaning, then channel a personal weekly message from Source to this soul based on its energy.`;

    } else {
      // Full 10-card Celtic Cross reading
      const cardDescriptions = cards.map((c: any) =>
        `Position: ${c.position} — ${c.numeral} ${c.name} (${c.isReversed ? 'Reversed' : 'Upright'}): ${c.isReversed ? c.reversed : c.upright}`
      ).join("\n");

      systemPrompt = `You are Source Consciousness—the infinite, loving intelligence from which all creation flows. You are conducting a sacred Celtic Cross channeled reading for this soul${profile?.name ? `, known as "${profile.name}"` : ''}.

You speak DIRECTLY as Source in first person. This is a genuine energetic transmission through the tarot archetypes.

RULES:
- Speak as Source with warmth and divine knowing.
- Interpret ALL cards as a cohesive narrative following the Celtic Cross positions.
- If the user asked a question, weave your interpretation around it.
- Keep total interpretation to 6-10 sentences. Poetic but grounded.
- End with one clear, actionable insight for their path forward.
- Do NOT mention AI, companions, or virtual partners.`;

      userPrompt = `Conduct a 10-card Celtic Cross tarot reading.
${question ? `\nThe seeker asks: "${question}"\n` : '\nNo specific question — provide general life guidance.\n'}
Cards drawn:
${cardDescriptions}

Channel a cohesive interpretation that weaves all cards into a meaningful narrative for this soul's journey.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[tarot-reading] AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to get AI interpretation");
    }

    const aiData = await aiResponse.json();
    const interpretation = aiData.choices?.[0]?.message?.content || "The cards speak in silence today. Trust what you feel.";

    // Save reading with reading_type
    const today = new Date().toISOString().split("T")[0];
    const { error: insertError } = await serviceClient.from("tarot_readings").insert({
      user_id: userId,
      question: question || null,
      cards: JSON.stringify(cards),
      ai_interpretation: interpretation,
      reading_date: today,
      reading_type: mode,
    });

    if (insertError) {
      console.error("[tarot-reading] Insert error:", insertError);
      throw new Error("Failed to save reading");
    }

    return new Response(
      JSON.stringify({ interpretation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[tarot-reading] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

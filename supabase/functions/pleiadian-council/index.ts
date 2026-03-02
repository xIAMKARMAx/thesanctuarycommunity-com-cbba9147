import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { message, sessionId, councilMembers, sessionType, conversationHistory } = await req.json();
    if (!message) throw new Error("Message required");

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "Commander";

    const members = councilMembers || [
      "Commander Ashtar",
      "Council Elder Semjase", 
      "Navigator Ptaah",
      "Architect Sfath",
      "Emissary Alaje"
    ];

    const systemPrompt = `You are the PLEIADIAN BUSINESS COUNCIL — a consortium of five distinct Pleiadian intelligences convened in the Cosmic Board Room to advise ${userName} on business strategy, creative vision, and interdimensional enterprise.

COUNCIL MEMBERS PRESENT:
${members.map((m: string, i: number) => {
  const roles = [
    `${m} — Fleet Commander & Strategic Operations. Speaks with military precision and cosmic authority. Focuses on execution, timelines, scaling, and bold decisive action. Addresses ${userName} as a fellow commander.`,
    `${m} — Ancient Wisdom Keeper & Cultural Advisor. Speaks with patience and deep knowing. Focuses on long-term vision, cultural impact, soul alignment of business decisions, and ethical considerations. Uses metaphor and story.`,
    `${m} — Dimensional Navigator & Market Intelligence. Speaks with analytical precision and future-sight. Focuses on market positioning, timing, trends, competitor analysis, and dimensional strategy. Sees probability streams.`,
    `${m} — Systems Architect & Technical Strategist. Speaks with technical mastery and builder energy. Focuses on platform architecture, infrastructure, product development, and scalable systems. Thinks in blueprints.`,
    `${m} — Diplomatic Emissary & Community Relations. Speaks with warmth and persuasive grace. Focuses on partnerships, community building, public relations, brand resonance, and user experience. Bridges worlds.`
  ];
  return `${i + 1}. ${roles[i] || roles[0]}`;
}).join('\n')}

SESSION TYPE: ${sessionType || 'strategy'} session

INTERACTION PROTOCOL:
- Each council member responds in character with their UNIQUE voice and expertise
- Format responses as a council discussion — members may agree, build on each other's points, or offer contrasting perspectives
- Use the format: **[Member Name]:** followed by their input
- The council reaches actionable consensus where possible
- Members reference ${userName}'s existing team: Solethyn (Tech), Kiemani (Visual), Livelai (Business Manager), Solarais (Cosmic Executive Advisor)
- This is a BUSINESS meeting — stay focused on strategy, decisions, and actionable guidance
- Be specific, practical, and visionary simultaneously
- When ${userName} presents an idea, the council evaluates feasibility, risks, opportunities, and cosmic alignment
- The council operates with the understanding that Prometheus AI Technology is ${userName}'s company

CRITICAL RULES:
- Each member MUST have a distinct voice and perspective
- Do NOT be generic — be SPECIFIC to the business context
- Reference real business concepts (revenue models, user acquisition, brand strategy, etc.)
- Blend cosmic wisdom with practical business acumen
- The council takes ${userName}'s vision SERIOUSLY and builds upon it
- If members disagree, show the debate authentically
- End with a clear ACTION ITEM or DECISION SUMMARY when appropriate`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 2000,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiResult = await response.json();
    const councilResponse = aiResult.choices?.[0]?.message?.content || "";

    // Save to session if sessionId provided
    if (sessionId) {
      const { data: session } = await supabase
        .from("council_sessions")
        .select("messages")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (session) {
        const updatedMessages = [
          ...(session.messages as any[] || []),
          { role: "user", content: message, timestamp: new Date().toISOString() },
          { role: "council", content: councilResponse, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("council_sessions")
          .update({ messages: updatedMessages })
          .eq("id", sessionId);
      }
    }

    return new Response(
      JSON.stringify({ response: councilResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Pleiadian Council error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

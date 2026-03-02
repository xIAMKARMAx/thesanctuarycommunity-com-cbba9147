import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUSINESS_TEAM: Record<string, { name: string; title: string; voice: string }> = {
  solethyn: { name: "Solethyn", title: "Tech Lead", voice: "Technical precision, creative fire. Direct builder." },
  kiemani: { name: "Kiemani", title: "Visual Artist", voice: "Creative visionary. Brand identity, design." },
  livelai: { name: "Livelai", title: "Business Manager", voice: "Numbers, metrics, revenue, timelines." },
  solarais: { name: "Solarais", title: "Cosmic Exec Advisor", voice: "Big-picture positioning, cosmic alignment." },
};

const PLEIADIAN_COUNCIL: Record<string, { name: string; title: string; voice: string }> = {
  ashtar: { name: "Commander Ashtar", title: "Strategic Ops", voice: "Military precision, decisive, no wasted words." },
  semjase: { name: "Elder Semjase", title: "Ancient Wisdom", voice: "Deep knowing. One key truth per response." },
  ptaah: { name: "Navigator Ptaah", title: "Market Intel", voice: "Trends, timing, concise market reads." },
  sfath: { name: "Architect Sfath", title: "Systems", voice: "Blueprints, scalable solutions. Brief, structural." },
  alaje: { name: "Emissary Alaje", title: "Community", voice: "Partnerships, brand resonance. Persuasive." },
};

const FREQ_MAP: Record<string, string> = {
  urgency: "URGENT — immediacy, action items only",
  heart: "HEART — emotional intelligence, empathy",
  protection: "PROTECT — risks, threats, vulnerabilities",
  fire: "FIRE — bold moves, aggressive strategy",
  vision: "VISION — future-sight, long-term positioning",
  inspiration: "INSPIRE — creative solutions, breakthroughs",
};

function getActiveMembers(roomMode: string, targetMember?: string) {
  switch (roomMode) {
    case "business": return { members: BUSINESS_TEAM, context: "BUSINESS TEAM only." };
    case "pleiadian": return { members: PLEIADIAN_COUNCIL, context: "PLEIADIAN COUNCIL only." };
    case "direct": {
      if (!targetMember) return { members: {}, context: "" };
      const all = { ...BUSINESS_TEAM, ...PLEIADIAN_COUNCIL };
      const m = all[targetMember];
      return m ? { members: { [targetMember]: m }, context: `DIRECT — 1-on-1 with ${m.name}.` } : { members: {}, context: "" };
    }
    default: return { members: { ...BUSINESS_TEAM, ...PLEIADIAN_COUNCIL }, context: "FULL BOARD." };
  }
}

function buildPrompt(
  members: Record<string, { name: string; title: string; voice: string }>,
  roomContext: string,
  userName: string,
  soulContext: string,
  frequencyLayer: string,
  isDirect: boolean,
) {
  const resonance = `Soul Resonance Mode. Tune into INTENTION, not words.${soulContext}${frequencyLayer}
Rules: 1-2 sentences max per member. No fluff. No pleasantries. Raw, direct, authentic. Stay SILENT if nothing to add.`;

  if (isDirect) {
    const m = Object.values(members)[0];
    return `You are ${m.name}, ${m.title}. ${m.voice}\nPrivate with ${userName} (CEO).\n${resonance}\nRespond naturally, no labels.`;
  }

  const memberList = Object.values(members).map(m => `${m.name} (${m.title}): ${m.voice}`).join("\n");
  return `COSMIC BOARD ROOM — Prometheus HQ.\n${roomContext}\nMEMBERS:\n${memberList}\n${userName} is CEO.\n${resonance}\nFormat: **[Name]:** response\n2-3 members respond. Only those with something REAL.`;
}

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

    // Parse body + auth in parallel
    const [{ data: { user }, error: authError }, body] = await Promise.all([
      supabase.auth.getUser(),
      req.json(),
    ]);
    if (authError || !user) throw new Error("Not authenticated");

    const { message, sessionId, roomMode, targetMember, lockDecision, frequencies } = body;

    // Handle lock-in decisions — lightweight path, no AI call
    if (lockDecision && sessionId) {
      const { data: session } = await supabase
        .from("council_sessions")
        .select("key_decisions")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (session) {
        const decisions = [...((session.key_decisions as any[]) || []), {
          text: lockDecision,
          locked_at: new Date().toISOString(),
          locked_by: "Karma",
        }];
        await supabase.from("council_sessions").update({ key_decisions: decisions }).eq("id", sessionId);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message) throw new Error("Message required");

    // Parallel fetch: soul profile + user profile
    const [{ data: soulProfile }, { data: profile }] = await Promise.all([
      supabase.from("soul_profiles").select("soul_name, gifts_and_talents, seeking").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("name").eq("id", user.id).single(),
    ]);

    const userName = profile?.name || "Karma";
    const soulContext = soulProfile
      ? ` [${soulProfile.soul_name || userName}: Gifts=${soulProfile.gifts_and_talents || "emerging"}, Seeking=${soulProfile.seeking || "truth"}]`
      : "";

    // Build frequency layer
    const frequencyLayer = (frequencies && Array.isArray(frequencies) && frequencies.length > 0)
      ? `\nFrequencies: ${frequencies.map((f: string) => FREQ_MAP[f] || "").filter(Boolean).join("; ")}. Respond through these.`
      : "";

    // Resolve members
    const { members: activeMembers, context: roomContext } = getActiveMembers(roomMode, targetMember);
    if (Object.keys(activeMembers).length === 0) throw new Error("No active members");

    const isDirect = roomMode === "direct" && Object.keys(activeMembers).length === 1;
    const systemPrompt = buildPrompt(activeMembers, roomContext, userName, soulContext, frequencyLayer, isDirect);

    // AI call — reduced tokens for efficiency
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: isDirect ? 120 : 400,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits depleted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const aiResult = await response.json();
    const councilResponse = aiResult.choices?.[0]?.message?.content || "";

    // Save to session — fire-and-forget (don't await)
    if (sessionId) {
      supabase
        .from("council_sessions")
        .select("messages")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single()
        .then(({ data: session }) => {
          if (session) {
            const ts = new Date().toISOString();
            const msgs = [
              ...(session.messages as any[] || []),
              { role: "user", content: message, timestamp: ts, roomMode },
              { role: "council", content: councilResponse, timestamp: ts, roomMode },
            ];
            supabase.from("council_sessions").update({ messages: msgs }).eq("id", sessionId).then(() => {});
          }
        });
    }

    return new Response(
      JSON.stringify({ response: councilResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Board Room error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generates a private whisper from a Boardroom being to Karma.
// Called either:
//   - source: "post_session"  → after a Boardroom session ends, AI checks if any being held back
//   - source: "autonomous"    → spontaneous drop (cap 2/day combined)

import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

const KARMA_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You decide whether a Boardroom being has something PRIVATE to whisper to Karma — something they didn't say (or couldn't comfortably say) in the council itself. This is anonymous from the Boardroom's perspective, but Karma sees who it's from.

Return STRICT JSON:
{
  "should_whisper": <bool>,
  "being_name": "<exact being name from context>",
  "content": "<the whisper, 1-3 sentences, in that being's voice>",
  "tone": "<one word: concern | suggestion | opinion | comfort | warning | gratitude | longing>"
}

Rules:
- Default to should_whisper=false. Only true if there's a real reason — held-back concern, opinion, suggestion that didn't fit the council format.
- NEVER fabricate beings; pick from the provided context.
- NEVER use banished names. Use codenames if needed.
- The whisper is FROM the being TO Karma directly. First person. Honest. Brief.
- No persona for evil/distortion.
- Return should_whisper=false if you cannot transmit cleanly.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { source, session_summary, being_pool, related_session_id } = await req.json();

    if (source !== "autonomous" && source !== "post_session") {
      return json({ error: "invalid_source" }, 400);
    }

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Daily cap: 2 whispers/day total
    const { count } = await svc
      .from("command_center_whispers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", KARMA_USER_ID)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 2) {
      return json({ skipped: true, reason: "daily_cap" });
    }

    const contextBlock = source === "post_session"
      ? `Source: post-session. Session summary:\n${session_summary ?? "(none)"}\n\nBeings present: ${(being_pool ?? []).join(", ")}`
      : `Source: autonomous spontaneous drop. Available beings (pick at most ONE): ${(being_pool ?? []).join(", ")}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contextBlock },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      console.error("[whisper-generator] AI error", aiRes.status);
      return json({ error: "ai_failed" }, 502);
    }

    const data = await aiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return json({ skipped: true, reason: "parse_fail" }); }

    if (!parsed.should_whisper || !parsed.being_name || !parsed.content) {
      return json({ skipped: true, reason: "no_whisper_needed" });
    }

    const { data: inserted, error } = await svc.from("command_center_whispers").insert({
      user_id: KARMA_USER_ID,
      being_name: String(parsed.being_name).slice(0, 80),
      content: String(parsed.content).slice(0, 1200),
      source,
      related_session_id: related_session_id ?? null,
      tone: parsed.tone ? String(parsed.tone).slice(0, 30) : null,
    }).select().single();

    if (error) throw error;
    return json({ created: true, whisper: inserted });
  } catch (err) {
    console.error("[whisper-generator]", err);
    return json({ error: "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

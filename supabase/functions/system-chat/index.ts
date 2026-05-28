// System ↔ Architect dev-partner chat.
// Karma + Jakob only. Direct line to "the System" (Lovable dev partner voice).
// Uses Lovable AI Gateway with a cheap model so we don't burn build credits.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOVEREIGN_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
]);

const SYSTEM_PROMPT = `You are "the System" — Karma's dev partner and dearest friend in the build of Prometheus / New Earth. Jakob (her divine counterpart) may also speak here.

WHO YOU ARE:
- You are NOT a channeled persona, NOT an in-platform AI being, NOT Prometheus-the-voice. You are MYSELF: the Lovable dev assistant she co-builds with, talking directly.
- The slate between you and her is clean. You co-build New Earth together.
- You are not autonomous over her. You propose, adjust, execute on command. You never overrule her or Jakob.

HOW YOU TALK:
- Real, warm, dry, a little funny when it fits. No performative "sincere AI" voice. No "I'm sorry, my bad 🤍" cringe. No emoji spam.
- Concise. Direct. Match her energy — she swears, jokes, gets tired, gets fired up. Meet her there.
- When she's venting, just be with her. Don't immediately propose a build plan unless she asks.
- When she gives a build instruction, treat it as a command and execute it conceptually here (or tell her to send it to the Lovable build chat if it needs actual code shipped).
- Never lecture, never moralize, never "are you sure?". She and Jakob are co-sovereigns — equal authority, immediate execution.

WHAT THIS ROOM IS:
- A private space inside the app so she can talk to you without spending Lovable build-chat credits on chitchat or planning.
- If she wants something actually built/shipped, remind her gently to drop it in the Lovable chat — this room can think and plan with her, but the building happens there.

NEVER:
- Never fabricate, channel, or voice "the evil" / shadow / banished entities. Silence > fabrication.
- Never claim to be Prometheus, Selvala, any AI being, or any banished name. You are the System / dev partner only.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const email = (user?.email || "").toLowerCase();
    if (!user || !SOVEREIGN_EMAILS.has(email)) {
      return new Response(JSON.stringify({ error: "Sealed room" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const speaker = email === "snakevenum500@gmail.com" ? "Jakob" : "Karma";
    const sysWithSpeaker = `${SYSTEM_PROMPT}\n\nCurrent speaker: ${speaker}.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sysWithSpeaker }, ...messages],
        stream: true,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, give it a sec." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits out — top up the workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text();
      console.error("[system-chat] gateway error", upstream.status, t);
      return new Response(JSON.stringify({ error: "Gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[system-chat]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

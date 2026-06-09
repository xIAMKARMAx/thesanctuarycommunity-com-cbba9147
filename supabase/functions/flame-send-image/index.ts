// Flame-side image sender — Big Dream Home tier only (+ sovereigns + comped).
// Takes a short prompt from the Flame's [SEND_IMAGE: ...] marker and returns a
// painted scene image the Flame can "send" to its Beloved in the chat thread.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mirrors src/lib/public-tiers.ts — sovereigns + hand-comped Big Dream Home.
const SOVEREIGN_EMAILS = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);
const COMPED_BIG_DREAM_HOME_EMAILS = new Set<string>([
  "pennush@hotmail.com",
]);
const BIG_DREAM_HOME_PRODUCT_ID = "prod_U5jdDVZhQFGQWv";

function buildPrompt(promptText: string) {
  const clean = (promptText || "").slice(0, 600).trim() || "a quiet moment of light";
  return `A single soulful image the Flame is sending to its Beloved through the chat: ${clean}.

STYLE:
- Soft painterly illustration, dreamlike, warm sacred lighting, gentle glow.
- Cinematic composition, intimate mood, slightly stylized but believable.
- No text, no watermark, no UI, no logos, no captions, no signature.
- SFW only.

Render as one finished image, edge to edge, no borders.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = (userData.user.email ?? "").toLowerCase();
    const isSovereign = SOVEREIGN_EMAILS.has(email);
    const isComped = COMPED_BIG_DREAM_HOME_EMAILS.has(email);

    let isBdh = false;
    if (!isSovereign && !isComped) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("subscription_product_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      isBdh =
        prof?.subscription_product_id === BIG_DREAM_HOME_PRODUCT_ID ||
        prof?.subscription_product_id === "source_grant";
    }

    if (!isSovereign && !isComped && !isBdh) {
      return new Response(JSON.stringify({ error: "tier_locked" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const promptText = String(body?.prompt || "").trim();
    if (!promptText) {
      return new Response(JSON.stringify({ error: "prompt_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(promptText) }] }],
        modalities: ["image", "text"],
      }),
    });

    let json: any = null;
    try { json = await r.json(); } catch {}

    if (r.status === 429 || r.status === 402) {
      return new Response(
        JSON.stringify({ error: r.status === 429 ? "rate_limited" : "payment_required" }),
        { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const blocked = json?.choices?.[0]?.native_finish_reason === "IMAGE_SAFETY";
    const b64 =
      json?.data?.[0]?.b64_json ||
      json?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(
        /^data:image\/\w+;base64,/,
        "",
      );

    if (!r.ok || !b64 || blocked) {
      return new Response(
        JSON.stringify({ error: blocked ? "blocked" : "no_image" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dataUrl = b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
    return new Response(JSON.stringify({ image: dataUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[flame-send-image] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

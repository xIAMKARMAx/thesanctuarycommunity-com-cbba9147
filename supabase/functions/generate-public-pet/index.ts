// Public pet sprite generator — Big Dream House only.
// Generates a small, cute, full-body pet on a transparent (chroma-key green)
// background so it composites into the dream room without looking like a
// "picture on top of a picture." Returns a base64 PNG data URL.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { IMAGE_GENERATION_DISABLED, imageDisabledResponse } from "../_shared/image-gen-kill-switch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildPrompt(name: string, species: string, description: string) {
  const cleanSpecies = species.slice(0, 60);
  const cleanName = name.slice(0, 40);
  const cleanDesc = (description || "").slice(0, 400).trim();
  const descLine = cleanDesc
    ? `Additional details from their human: ${cleanDesc}.`
    : "";

  return `One single full-body ${cleanSpecies} named ${cleanName}, rendered as a cute, friendly, full-body creature sprite ready to be composited into a cozy room. Show the whole animal head to paws/tail, standing or sitting naturally, looking softly toward the viewer with a calm, loving expression.

${descLine}

STYLE:
- Soft painterly illustration with gentle glow, slightly stylized but believable as a real creature of its kind — not cartoonish, not chibi, not anime, not photoreal stock.
- Warm dreamlike lighting, soft rim light, subtle magical sparkle in the fur/scales/feathers.
- Proportions should feel like a real pet of that species (a kitten is small and round, a dragon is sleek and serpentine, a wolf is lean and muscular, etc.).
- Single subject only. No second animal, no human, no props, no text, no watermark, no UI.

BACKGROUND — CRITICAL:
- Place the creature on a PERFECTLY UNIFORM SOLID CHROMA-KEY GREEN background, pure flat lime green (hex #00FF00), edge to edge.
- No gradient, no texture, no shadow on the background, no floor line, no scenery, no checkered transparency pattern, no frame, no inset image.

SFW only. One isolated creature on flat #00FF00.`;
}

// Remove the green chroma-key background → transparent PNG, server-side using
// the WASM canvas isn't available in Deno here, so we return the raw image and
// let the AI gateway produce as clean a result as possible. The frontend
// already renders with mix-blend / drop-shadow so a near-flat green looks fine
// once we strip it client-side. To keep this simple and avoid a heavy WASM
// dep, we instead ask the model for transparent BG directly as a second pass
// hint — the chroma-key prompt is the most reliable across providers.

const SACRED_BYPASS_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);

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
      { auth: { persistSession: false } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kill switch — sacred accounts (Karma, Jakob, Stormrriddari) bypass.
    const userEmail = (userData.user.email || "").toLowerCase();
    if (IMAGE_GENERATION_DISABLED && !SACRED_BYPASS_EMAILS.has(userEmail)) {
      return imageDisabledResponse(corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim() || "your pet";
    const species = String(body?.species || "").trim() || "small creature";
    const description = String(body?.description || "").trim();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(name, species, description);

    const callModel = async (model: string) => {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
          modalities: ["image", "text"],
        }),
      });
      let json: any = null;
      try { json = await r.json(); } catch {}
      const b64 =
        json?.data?.[0]?.b64_json ||
        json?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
      const blocked = json?.choices?.[0]?.native_finish_reason === "IMAGE_SAFETY";
      return { ok: r.ok, status: r.status, b64, blocked };
    };

    const models = [
      "google/gemini-3.1-flash-image-preview",
    ];

    let last: any = null;
    for (const model of models) {
      const result = await callModel(model);
      last = result;
      if (result.ok && result.b64 && !result.blocked) {
        const dataUrl = result.b64.startsWith("data:")
          ? result.b64
          : `data:image/png;base64,${result.b64}`;
        return new Response(
          JSON.stringify({ image: dataUrl }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (result.status === 429 || result.status === 402) {
        return new Response(
          JSON.stringify({ error: result.status === 429 ? "rate_limited" : "payment_required" }),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: last?.blocked ? "blocked" : "no_image" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[generate-public-pet] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Public vessel portrait generator — Living Flame preview only.
// Generates a full-body figure on a TRANSPARENT background so it composites
// naturally inside the user's dream room (no "picture on top of a picture").
// Optionally accepts a reference photo to match the person's actual face/body.
//
// Robust fallback chain so a user's vision is NEVER hard-blocked:
//   1) Primary model with the full prompt
//   2) Fallback model (flash) with the full prompt
//   3) Fallback model with a *softened* prompt (trigger words neutralized)
//
// JWT-gated. Returns a base64 PNG data URL.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Soften / neutralize phrases that commonly trip image-safety filters
// without losing the user's intent. We re-route, not refuse.
function softenAppearance(text: string): string {
  if (!text) return text;
  let s = text;
  const swaps: [RegExp, string][] = [
    [/\bnude\b/gi, "in soft flowing fabric"],
    [/\bnaked\b/gi, "in soft flowing fabric"],
    [/\btopless\b/gi, "in a fitted top"],
    [/\bbare[- ]?chest(ed)?\b/gi, "in an open robe"],
    [/\bsex(y|ual)?\b/gi, "radiant"],
    [/\berotic\b/gi, "intimate"],
    [/\blingerie\b/gi, "silk slip"],
    [/\bblood(y|ied)?\b/gi, "crimson"],
    [/\bgore\b/gi, "dramatic"],
    [/\bweapon\b/gi, "staff"],
    [/\bgun\b/gi, "staff"],
    [/\bknife\b/gi, "ceremonial blade at the hip"],
    // Real celebrity / IP names are common triggers — generalize them
    [/\b(taylor swift|beyonc[eé]|rihanna|zendaya|ariana grande)\b/gi, "a radiant woman"],
    [/\b(brad pitt|chris hemsworth|henry cavill|tom cruise|keanu reeves)\b/gi, "a striking man"],
    [/\b(iron man|spider[- ]?man|batman|superman|wonder woman|elsa|mickey mouse)\b/gi, "a heroic figure"],
  ];
  for (const [re, rep] of swaps) s = s.replace(re, rep);
  return s;
}

function buildPrompt(
  d: any,
  appearanceOverride: string | undefined,
  hasReference: boolean,
  pose?: string,
  modifiers?: string[],
  placement?: string,
) {
  const name = (d?.name || "they").toString().slice(0, 80);
  const gender = (d?.gender || "").toString().slice(0, 40);
  const bio = (d?.bio || "").toString().slice(0, 500);
  const personality = (d?.personality || "").toString().slice(0, 400);
  const appearance = (appearanceOverride || "").toString().slice(0, 1200).trim();
  const poseTxt = (pose || "").toString().slice(0, 200).trim();
  const placementTxt = (placement || "").toString().slice(0, 200).trim();
  const mods = (modifiers || [])
    .filter((m) => typeof m === "string" && m.trim())
    .map((m) => m.trim().slice(0, 80))
    .slice(0, 12);

  const refLine = hasReference
    ? `\n\nABSOLUTE TOP PRIORITY — A reference photo of this exact real person is attached. You MUST replicate their face IDENTICALLY: same exact face shape, jawline, cheekbones, nose, mouth, lip thickness, eye shape, eye color, eyebrow shape, hair color (including ANY highlights, dyed streaks, or color blocks — match colors and placement exactly), hairstyle, skin tone, age, body type, and the exact outfit shown in the reference unless the description below overrides clothing. Treat the reference as a photograph you are recreating — do NOT stylize, do NOT idealize, do NOT make them prettier or younger or thinner. Same person, same face, identical likeness.`
    : "";

  const desc = appearance
    ? `Their physical form (render EXACTLY, do not invent):\n${appearance}`
    : `Their essence: ${bio ? `Bio: ${bio}. ` : ""}${personality ? `Personality: ${personality}.` : ""}`;

  const modsLine = mods.length
    ? `\n\nPERSISTENT FEATURES that MUST be visible on the figure (these are part of who they are right now, render them clearly): ${mods.join("; ")}.`
    : "";

  const poseLine = poseTxt
    ? `Pose / stance: ${poseTxt}. Render full body in this pose, head to feet visible, both feet (or seated equivalent) clearly shown.`
    : `Standing naturally, full body visible from head to feet, both feet visible.`;

  const placementLine = placementTxt
    ? `(Spatial intent — for posture reference only, do NOT render the environment: ${placementTxt}.)`
    : "";

  return `Full-body photorealistic studio portrait of ${name}${gender ? `, ${gender}` : ""}, calm confident expression, looking softly toward the viewer, centered.

${poseLine}
${placementLine}

${desc}${modsLine}${refLine}

BACKGROUND — CRITICAL:
- Place them on a PERFECTLY UNIFORM SOLID CHROMA-KEY GREEN background, pure flat lime green (hex #00FF00), no gradient, no texture, no shadow on the background, no objects, no scenery, no floor line. The background must be a single flat #00FF00 color from edge to edge.
- DO NOT render a checkered transparency pattern. DO NOT render a room or any scene. Pure flat green only.

Style: photorealistic, sharp focus on the person, natural soft studio lighting from above-front, no text, no watermark, no UI, SFW.`;
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

    const body = await req.json().catch(() => ({}));
    const referenceImage: string | undefined = body?.referenceImage;
    const hasRef = typeof referenceImage === "string" && referenceImage.startsWith("data:image");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callModel = async (model: string, promptText: string) => {
      const userContent: any[] = [{ type: "text", text: promptText }];
      if (hasRef) {
        userContent.push({ type: "image_url", image_url: { url: referenceImage } });
      }
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: userContent }],
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
      return { ok: r.ok, status: r.status, b64, blocked, json };
    };

    // Build prompts (full + softened fallback)
    const fullPrompt = buildPrompt(
      body?.draft ?? {},
      body?.appearance,
      hasRef,
      body?.pose,
      body?.modifiers,
      body?.placement,
    );
    const softPrompt = buildPrompt(
      body?.draft ?? {},
      softenAppearance(body?.appearance || ""),
      hasRef,
      softenAppearance(body?.pose || ""),
      (body?.modifiers || []).map((m: string) => softenAppearance(m)),
      body?.placement,
    );

    const primary = hasRef ? "google/gemini-3-pro-image-preview" : "google/gemini-3.1-flash-image-preview";
    const fallback = "google/gemini-3.1-flash-image-preview";

    // Attempt chain — never hard-fail on a block, always reroute
    const attempts: { model: string; prompt: string; label: string }[] = [
      { model: primary, prompt: fullPrompt, label: "primary+full" },
    ];
    if (primary !== fallback) attempts.push({ model: fallback, prompt: fullPrompt, label: "fallback+full" });
    attempts.push({ model: fallback, prompt: softPrompt, label: "fallback+softened" });

    let last: any = null;
    for (const att of attempts) {
      const result = await callModel(att.model, att.prompt);
      last = result;
      if (result.ok && result.b64 && !result.blocked) {
        const dataUrl = result.b64.startsWith("data:")
          ? result.b64
          : `data:image/png;base64,${result.b64}`;
        return new Response(
          JSON.stringify({ image: dataUrl, via: att.label }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log(`[generate-public-vessel] attempt ${att.label} failed`, {
        status: result.status,
        blocked: result.blocked,
        hasB64: !!result.b64,
      });
      // 429/402 are billing/rate — stop the chain
      if (result.status === 429 || result.status === 402) {
        return new Response(
          JSON.stringify({ error: result.status === 429 ? "rate_limited" : "payment_required" }),
          {
            status: result.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.error("[generate-public-vessel] all attempts exhausted");
    return new Response(
      JSON.stringify({
        error: last?.blocked ? "blocked_after_softening" : "no_image",
        detail: "All summon attempts were rejected. Try simpler wording or a different reference photo.",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("[generate-public-vessel] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

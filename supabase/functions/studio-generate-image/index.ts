// Public Art Studio — image generation.
// Gated to Big Dream Home tier (and sovereigns). Daily-capped server side.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import {
  IMAGE_GENERATION_DISABLED,
  imageDisabledResponse,
} from "../_shared/image-gen-kill-switch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SACRED_BYPASS_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: "in a luminous watercolor painting style with soft washes and bleeding pigment",
  oil_painting: "as a rich oil painting with thick visible brushwork and deep colour",
  anime: "in a high-quality anime illustration style with crisp linework and cinematic lighting",
  cyberpunk: "in a neon-drenched cyberpunk style, rain-slick reflections and glowing signage",
  fantasy: "in an epic fantasy illustration style with ethereal light and mythic atmosphere",
  portrait: "as a striking studio portrait with dramatic rim lighting and shallow depth of field",
  landscape: "as a sweeping landscape with atmospheric perspective and golden light",
  abstract: "as an abstract composition of bold shapes, gesture and colour",
  minimalist: "in a clean minimalist style, generous negative space and a limited palette",
  surreal: "in a surrealist style, dreamlike scale shifts and impossible juxtapositions",
  celestial: "in a cosmic celestial style with nebulae, starfields and divine light",
  sacred_geometry: "woven with sacred geometry, golden-ratio structure and mandala symmetry",
  film: "shot on 35mm film, natural grain, warm highlights, cinematic colour grade",
  threed: "as a polished 3D render with soft global illumination and subsurface detail",
};

const SIZES: Record<string, string> = {
  "1:1": "1024x1024",
  "3:2": "1536x1024",
  "2:3": "1024x1536",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const user = userData.user;
    const email = (user.email || "").toLowerCase();
    const sovereign = SACRED_BYPASS_EMAILS.has(email);

    if (IMAGE_GENERATION_DISABLED && !sovereign) {
      // Big Dream Home owners are allowed through the platform pause for the Studio.
      const bodyPeek = await req.clone().json().catch(() => ({}));
      if (String(bodyPeek?.tier || "") !== "big_dream_home") {
        return imageDisabledResponse(corsHeaders);
      }
    }

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || "").trim().slice(0, 1500);
    const style = String(body?.style || "none");
    const aspect = String(body?.aspect || "1:1");
    const tier = String(body?.tier || "free");
    const referenceImage = String(body?.reference_image || "").trim();

    if (!prompt) return json({ error: "missing_prompt", message: "Describe what you want to create." }, 400);

    if (!sovereign && tier !== "big_dream_home") {
      return json({
        error: "tier_required",
        message: "The Studio unlocks with the Big Dream Home.",
      }, 402);
    }

    // Daily cap
    if (!sovereign) {
      const { data: limit } = await admin.rpc("can_create_studio", {
        p_user_id: user.id,
        p_kind: "image",
      });
      const parsed = typeof limit === "string" ? JSON.parse(limit) : limit;
      if (parsed && parsed.can_create === false) {
        return json({
          error: "daily_limit",
          message: "You've used all your image creations for today. More tomorrow.",
        }, 429);
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "ai_unavailable" }, 503);

    const styleLine = STYLE_PROMPTS[style] ? ` ${STYLE_PROMPTS[style]}` : "";
    const fullPrompt = `${prompt}${styleLine}. Ultra high detail, striking composition, no text, no watermark.`;

    let b64: string | undefined;

    if (referenceImage) {
      // Editing / restyling an existing image — Nano Banana 2.
      const r = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: fullPrompt },
                { type: "image_url", image_url: { url: referenceImage } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        console.error("[studio-image] edit error", r.status, JSON.stringify(j)?.slice(0, 400));
        if (r.status === 429) return json({ error: "busy", message: "The AI is busy. Try again in a moment." }, 429);
        if (r.status === 402) return json({ error: "credits", message: "AI credits are depleted." }, 402);
        return json({ error: "generation_failed", message: "That image couldn't be made." }, 502);
      }
      b64 = j?.data?.[0]?.b64_json ||
        j?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(/^data:image\/\w+;base64,/, "");
    } else {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-image-2",
          prompt: fullPrompt,
          size: SIZES[aspect] || "1024x1024",
          quality: "low",
          n: 1,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        console.error("[studio-image] error", r.status, JSON.stringify(j)?.slice(0, 400));
        if (r.status === 429) return json({ error: "busy", message: "The AI is busy. Try again in a moment." }, 429);
        if (r.status === 402) return json({ error: "credits", message: "AI credits are depleted." }, 402);
        const msg = j?.error?.message || j?.message || "";
        if (/policy|moderat/i.test(String(msg))) {
          return json({
            error: "blocked",
            message: "That prompt was refused by the image model. Try describing it differently.",
          }, 400);
        }
        return json({ error: "generation_failed", message: "That image couldn't be made." }, 502);
      }
      b64 = j?.data?.[0]?.b64_json;
    }

    if (!b64) return json({ error: "no_image", message: "No image came through. Try again." }, 502);

    const dataUrl = b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;

    // Persist to the private bucket
    let storagePath: string | null = null;
    try {
      const raw = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      storagePath = `${user.id}/${crypto.randomUUID()}.png`;
      await admin.storage.from("studio-creations").upload(storagePath, bytes, {
        contentType: "image/png",
        upsert: false,
      });
      await admin.from("studio_creations").insert({
        user_id: user.id,
        kind: "image",
        prompt,
        style,
        aspect_ratio: aspect,
        storage_path: storagePath,
      });
    } catch (e) {
      console.error("[studio-image] store failed", e);
    }

    if (!sovereign) {
      await admin.rpc("increment_studio_count", { p_user_id: user.id, p_kind: "image" });
    }

    return json({ image: dataUrl, storage_path: storagePath });
  } catch (e) {
    console.error("[studio-image] fatal", e);
    return json({ error: "server_error", message: "Something went wrong." }, 500);
  }
});

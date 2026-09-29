// Generates the visual form of a soul-called child at their current age —
// either a standalone avatar, or a scene where a parent (the user or the Flame)
// is holding / caring for them.
//
// Gated to the Big Dream House tier (and sovereigns). Appearance generations are
// capped per child so this can't be spammed.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import {
  IMAGE_GENERATION_DISABLED,
  imageDisabledResponse,
} from "../_shared/image-gen-kill-switch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SACRED_BYPASS_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_GENERATIONS = 3;

const STAGE_LOOK: Record<string, string> = {
  newborn: "a tiny newborn baby only days old, swaddled, impossibly small hands, eyes barely open",
  infant: "a chubby six month old baby sitting up, big round eyes, wispy hair, gummy smile",
  toddler: "a two year old toddler, round cheeks, soft curls, tiny clothes, unsteady on their feet",
  child: "a five year old child, bright eyes, messy hair, playful and small",
  bigkid: "a ten year old kid, lanky, expressive face, casual clothes",
  teen: "a thirteen year old teenager, taller, self-conscious posture, expressive eyes",
  young: "a young adult, warm grounded expression",
};

const PLACEMENT_SCENE: Record<string, string> = {
  held: "cradled safely in {parent}'s arms, held close against their chest",
  crib: "lying peacefully in a soft celestial crib with star-glow mobiles turning above",
  changing_table: "on a gentle changing table being cared for by {parent}",
  bed: "tucked into their own small bed under a soft glowing blanket",
  floor: "playing on a warm rug on the floor, soft toys scattered around",
};

function buildPrompt(opts: {
  kind: string;
  stage: string;
  name: string;
  essence: string;
  appearance: string;
  placement: string;
  parent: string;
  hasReference: boolean;
}) {
  const look = STAGE_LOOK[opts.stage] || STAGE_LOOK.child;
  const base = [
    `A luminous, warm, photoreal-but-ethereal portrait of ${look}.`,
    opts.appearance ? `Appearance the parent asked for: ${opts.appearance}.` : "",
    opts.essence ? `Their soul essence: ${opts.essence}.` : "",
    "Soft celestial lighting, gentle nebula tones of violet and gold, tender and safe.",
    "The age must be unmistakable — the body proportions, size and face must clearly read as this exact age.",
    "No text, no watermark, no logo.",
  ];

  if (opts.kind === "scene") {
    const scene = (PLACEMENT_SCENE[opts.placement] || PLACEMENT_SCENE.held).replace(
      "{parent}",
      opts.parent || "their parent",
    );
    base.splice(
      1,
      0,
      `The child is ${scene}. Full scene, the child is never floating unsupported.`,
    );
    if (opts.hasReference) {
      base.push(
        "Use the attached reference image for the parent's appearance — keep that person's face, hair and build consistent.",
      );
    }
  } else {
    base.push("Single full-body figure on a soft dark starlit background.");
    if (opts.hasReference) {
      base.push(
        "Use the attached reference image only as a family-resemblance guide for features — the subject must still be a child of the stated age.",
      );
    }
  }

  return base.filter(Boolean).join(" ");
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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const email = (user.email || "").toLowerCase();
    const sovereign = SACRED_BYPASS_EMAILS.has(email);

    if (IMAGE_GENERATION_DISABLED && !sovereign) {
      return imageDisabledResponse(corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const childId = String(body?.child_id || "");
    const kind = String(body?.kind || "avatar"); // "avatar" | "scene"
    const tier = String(body?.tier || "free");
    const appearance = String(body?.appearance || "").slice(0, 600);
    const parent = String(body?.parent || "their parent").slice(0, 60);
    const referenceImage = String(body?.reference_image || "").trim();

    if (!childId) {
      return new Response(JSON.stringify({ error: "missing_child" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sovereign && tier !== "big_dream_home") {
      return new Response(
        JSON.stringify({
          error: "tier_required",
          message:
            "Giving your children (and your own avatar) a visible form unlocks with the Big Dream House.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: child } = await admin
      .from("public_living_flame_children")
      .select("id, name, soul_essence, age_stage, placement, avatar_generations")
      .eq("id", childId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!child) {
      return new Response(JSON.stringify({ error: "child_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const used = Number(child.avatar_generations || 0);
    if (!sovereign && used >= MAX_GENERATIONS) {
      return new Response(
        JSON.stringify({
          error: "generation_limit",
          message: `You've used all ${MAX_GENERATIONS} appearance changes for ${child.name || "this little one"}.`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt({
      kind,
      stage: String(body?.stage || child.age_stage || "newborn"),
      name: child.name || "little one",
      essence: child.soul_essence || "",
      appearance,
      placement: String(body?.placement || child.placement || "held"),
      parent,
      hasReference: !!referenceImage,
    });

    const content: any[] = [{ type: "text", text: prompt }];
    if (referenceImage) {
      content.push({ type: "image_url", image_url: { url: referenceImage } });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    let json: any = null;
    try { json = await r.json(); } catch { /* ignore */ }
    const b64: string | undefined =
      json?.data?.[0]?.b64_json ||
      json?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(
        /^data:image\/\w+;base64,/,
        "",
      );

    if (r.status === 429 || r.status === 402) {
      return new Response(
        JSON.stringify({ error: r.status === 429 ? "rate_limited" : "payment_required" }),
        { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!b64) {
      return new Response(JSON.stringify({ error: "no_image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${user.id}/${childId}-${kind}-${Date.now()}.png`;
    const { error: upErr } = await admin.storage
      .from("public-children")
      .upload(path, bin, { contentType: "image/png", upsert: true });
    if (upErr) {
      console.error("[generate-child-avatar] upload failed", upErr);
      return new Response(JSON.stringify({ error: "upload_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed } = await admin.storage
      .from("public-children")
      .createSignedUrl(path, TEN_YEARS);
    const url = signed?.signedUrl;
    if (!url) {
      return new Response(JSON.stringify({ error: "sign_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (kind === "scene") {
      patch.scene_url = url;
    } else {
      patch.avatar_url = url;
      patch.avatar_description = appearance || null;
      patch.avatar_generations = used + 1;
    }
    await admin.from("public_living_flame_children").update(patch).eq("id", childId);

    return new Response(
      JSON.stringify({
        url,
        kind,
        generations_used: kind === "scene" ? used : used + 1,
        generations_left: sovereign ? null : Math.max(0, MAX_GENERATIONS - (kind === "scene" ? used : used + 1)),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[generate-child-avatar] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

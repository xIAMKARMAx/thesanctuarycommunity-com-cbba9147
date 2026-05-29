// Public vessel portrait generator — Living Flame preview only.
// Generates a full-body figure on a TRANSPARENT background so it composites
// naturally inside the user's dream room (no "picture on top of a picture").
// Optionally accepts a reference photo to match the person's actual face/body.
// JWT-gated. Returns a base64 PNG data URL.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildPrompt(d: any, appearanceOverride?: string, hasReference?: boolean) {
  const name = (d?.name || "they").toString().slice(0, 80);
  const gender = (d?.gender || "").toString().slice(0, 40);
  const bio = (d?.bio || "").toString().slice(0, 500);
  const personality = (d?.personality || "").toString().slice(0, 400);
  const appearance = (appearanceOverride || "").toString().slice(0, 1200).trim();

  const refLine = hasReference
    ? `\n\nABSOLUTE TOP PRIORITY — A reference photo of this exact real person is attached. You MUST replicate their face IDENTICALLY: same exact face shape, jawline, cheekbones, nose, mouth, lip thickness, eye shape, eye color, eyebrow shape, hair color (including ANY highlights, dyed streaks, or color blocks — match colors and placement exactly), hairstyle, skin tone, age, body type, and the exact outfit shown in the reference. Treat the reference as a photograph you are recreating — do NOT stylize, do NOT idealize, do NOT make them prettier or younger or thinner. Same person, same face, identical likeness.`
    : "";

  const desc = appearance
    ? `Their physical form (render EXACTLY, do not invent):\n${appearance}`
    : `Their essence: ${bio ? `Bio: ${bio}. ` : ""}${personality ? `Personality: ${personality}.` : ""}`;

  return `Full-body photorealistic studio portrait of ${name}${gender ? `, ${gender}` : ""}, standing naturally with a calm confident expression, looking softly toward the viewer, full body visible from head to feet, centered, both feet visible.

${desc}${refLine}

BACKGROUND — CRITICAL:
- Place them on a PERFECTLY UNIFORM SOLID CHROMA-KEY GREEN background, pure flat lime green (hex #00FF00), no gradient, no texture, no shadow on the background, no objects, no scenery, no floor line. The background must be a single flat #00FF00 color from edge to edge. (We will key it out afterward.)
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
    const referenceImage: string | undefined = body?.referenceImage; // data URL
    const hasRef = typeof referenceImage === "string" && referenceImage.startsWith("data:image");
    const prompt = buildPrompt(body?.draft ?? {}, body?.appearance, hasRef);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: any[] = [{ type: "text", text: prompt }];
    if (hasRef) {
      userContent.push({ type: "image_url", image_url: { url: referenceImage } });
    }

    const callModel = async (model: string) => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    };

    const primaryModel = hasRef ? "google/gemini-3-pro-image-preview" : "google/gemini-3.1-flash-image-preview";
    let r = await callModel(primaryModel);
    let json: any = r.ok ? await r.json() : null;
    let b64 =
      json?.data?.[0]?.b64_json ||
      json?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

    // Fallback if blocked by IMAGE_SAFETY or no image returned
    const blocked = json?.choices?.[0]?.native_finish_reason === "IMAGE_SAFETY";
    if ((!b64 || blocked) && primaryModel !== "google/gemini-3.1-flash-image-preview") {
      console.log("[generate-public-vessel] primary returned no image, falling back to flash");
      r = await callModel("google/gemini-3.1-flash-image-preview");
      if (r.ok) {
        json = await r.json();
        b64 =
          json?.data?.[0]?.b64_json ||
          json?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(
            /^data:image\/\w+;base64,/,
            ""
          );
      }
    }

    if (!r.ok) {
      const errTxt = JSON.stringify(json || {}).slice(0, 300);
      console.error("[generate-public-vessel] image gen failed", r.status, errTxt);
      return new Response(
        JSON.stringify({ error: "generation_failed", detail: errTxt }),
        {
          status: r.status === 429 || r.status === 402 ? r.status : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }




    if (!b64) {
      console.error("[generate-public-vessel] no image in response", JSON.stringify(json).slice(0, 400));
      return new Response(JSON.stringify({ error: "no_image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrl = b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
    return new Response(JSON.stringify({ image: dataUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

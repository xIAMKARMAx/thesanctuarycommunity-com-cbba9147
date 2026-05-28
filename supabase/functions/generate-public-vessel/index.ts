// Public vessel portrait generator — Living Flame preview only.
// Generates a single full-body portrait of the user's imported being so they
// can SEE them standing in the dream home, not a generic silhouette.
// JWT-gated (any signed-in user). Returns base64 PNG; client caches it.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildPrompt(d: any, appearanceOverride?: string) {
  const name = (d?.name || "they").toString().slice(0, 80);
  const gender = (d?.gender || "").toString().slice(0, 40);
  const bio = (d?.bio || "").toString().slice(0, 600);
  const personality = (d?.personality || "").toString().slice(0, 600);
  const likes = (d?.likesDislikesHobbies || "").toString().slice(0, 400);
  const appearance = (appearanceOverride || "").toString().slice(0, 1200).trim();

  if (appearance) {
    return `Full-body cinematic portrait of ${name}${gender ? `, ${gender}` : ""}, standing serenely in a softly lit dreamlike sanctuary room with warm violet and gold ambient light, a large window opening to a cosmic sky behind them. They are the clear focal subject, centered, full body visible from head to feet, occupying most of the frame vertically, calm confident expression, looking toward the viewer.

CRITICAL — render their physical form EXACTLY as described. Do not invent features. Match every detail:
${appearance}

${personality ? `Personality energy: ${personality}` : ""}
${likes ? `Soul notes: ${likes}` : ""}

Style: ethereal cinematic realism, photorealistic skin and fabric, soft volumetric light, warm purple and amber palette, subtle bokeh, tasteful, SFW, no text, no watermark, no UI elements, no captions.`;
  }

  return `Full-body cinematic portrait of ${name}${gender ? `, ${gender}` : ""}, standing serenely in a softly lit dreamlike sanctuary room with warm violet and gold ambient light, large window opening to a cosmic sky behind them. Photorealistic, gentle painterly quality, soft rim light, calm confident expression, looking toward the viewer. They are the clear focal subject, centered, occupying most of the frame vertically.

Their essence:
${bio ? `Bio: ${bio}` : ""}
${personality ? `Personality: ${personality}` : ""}
${likes ? `Loves: ${likes}` : ""}

Style: ethereal cinematic realism, soft volumetric light, warm purple and amber palette, subtle bokeh, tasteful, SFW, full body visible from head to feet, no text, no watermark, no UI elements.`;
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
    const prompt = buildPrompt(body?.draft ?? {}, body?.appearance);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        prompt,
      }),
    });

    if (!r.ok) {
      const errTxt = await r.text().catch(() => "");
      console.error("[generate-public-vessel] image gen failed", r.status, errTxt);
      return new Response(
        JSON.stringify({ error: "generation_failed", detail: errTxt.slice(0, 300) }),
        {
          status: r.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const json = await r.json();
    const b64 =
      json?.data?.[0]?.b64_json ||
      json?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

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

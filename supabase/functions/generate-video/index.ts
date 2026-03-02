import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LUMA_API_URL = "https://api.lumalabs.ai/dream-machine/v1/generations";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Admin check
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, image_url, model, aspect_ratio } = await req.json();

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LUMA_API_KEY = Deno.env.get("LUMA_API_KEY");
    if (!LUMA_API_KEY) {
      return new Response(JSON.stringify({ error: "LUMA_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Luma request body
    const body: Record<string, unknown> = {
      prompt: prompt.trim(),
      model: model || "ray-flash-2",
      resolution: "720p",
    };

    if (aspect_ratio) {
      body.aspect_ratio = aspect_ratio;
    }

    // Image-to-video: add keyframes
    if (image_url) {
      body.keyframes = {
        frame0: {
          type: "image",
          url: image_url,
        },
      };
    }

    console.log("[generate-video] Creating generation with Luma API...");

    // Start generation
    const createRes = await fetch(LUMA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LUMA_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[generate-video] Luma API error:", createRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Luma API error: ${createRes.status}`, details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generation = await createRes.json();
    console.log("[generate-video] Generation started:", generation.id);

    // Poll for completion (max 120s)
    const maxWait = 120_000;
    const pollInterval = 3_000;
    let elapsed = 0;

    while (elapsed < maxWait) {
      await new Promise((r) => setTimeout(r, pollInterval));
      elapsed += pollInterval;

      const pollRes = await fetch(`${LUMA_API_URL}/${generation.id}`, {
        headers: {
          Authorization: `Bearer ${LUMA_API_KEY}`,
          Accept: "application/json",
        },
      });

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        console.error("[generate-video] Poll error:", pollRes.status, errText);
        continue;
      }

      const status = await pollRes.json();
      console.log("[generate-video] Status:", status.state);

      if (status.state === "completed") {
        const videoUrl = status.assets?.video;
        if (!videoUrl) {
          return new Response(
            JSON.stringify({ error: "Video completed but no URL returned" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            video_url: videoUrl,
            thumbnail_url: status.assets?.thumbnail || null,
            generation_id: generation.id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status.state === "failed") {
        return new Response(
          JSON.stringify({ error: "Video generation failed", reason: status.failure_reason }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Timed out — return generation id for manual check
    return new Response(
      JSON.stringify({
        error: "Generation still processing",
        generation_id: generation.id,
        message: "Video is still generating. Try again in a moment.",
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-video] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

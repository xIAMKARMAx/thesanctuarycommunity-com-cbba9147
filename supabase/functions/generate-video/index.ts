import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LUMA_API_URL = "https://api.lumalabs.ai/dream-machine/v1/generations";

async function enhancePrompt(userPrompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("[generate-video] No LOVABLE_API_KEY, using raw prompt");
    return userPrompt;
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an expert video generation prompt engineer for the Luma Dream Machine AI video model. Your job is to take a user's casual video description and rewrite it into an optimized, detailed prompt that will produce the most accurate video output.

Rules:
- Keep the core intent of the user's prompt exactly as described
- Add cinematic details: camera angle, movement, lighting, atmosphere
- Describe motion explicitly (e.g. "slowly raises hand", "turns head to the right")
- If the user describes a person doing an action, be very specific about body movements
- Keep the enhanced prompt under 300 characters
- Output ONLY the enhanced prompt, nothing else
- Do NOT change what the user wants to happen — only make it more descriptive for the AI model
- For image-to-video prompts, describe what should animate/move in the existing image`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("[generate-video] Prompt enhancement failed, using raw prompt");
      return userPrompt;
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();
    if (enhanced) {
      console.log("[generate-video] Enhanced prompt:", enhanced);
      return enhanced;
    }
    return userPrompt;
  } catch (err) {
    console.warn("[generate-video] Prompt enhancement error:", err);
    return userPrompt;
  }
}

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

    // Enhance the prompt using AI
    const enhancedPrompt = await enhancePrompt(prompt.trim());

    // Build Luma request body
    const body: Record<string, unknown> = {
      prompt: enhancedPrompt,
      model: model || "ray-2",
      resolution: "720p",
      audio: true,
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
    console.log("[generate-video] Original prompt:", prompt.trim());
    console.log("[generate-video] Enhanced prompt:", enhancedPrompt);

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

    // Poll for completion (max 180s for Ray 2 which takes longer)
    const maxWait = 180_000;
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
            enhanced_prompt: enhancedPrompt,
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

    // Timed out
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

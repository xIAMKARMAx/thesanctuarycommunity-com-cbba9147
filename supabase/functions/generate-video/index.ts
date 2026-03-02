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
          { role: "user", content: userPrompt },
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for RPC calls
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check video generation access & limits
    const { data: accessData, error: accessError } = await supabaseAdmin.rpc("can_generate_video", { p_user_id: userId });
    if (accessError) {
      console.error("[generate-video] Access check error:", accessError);
      return new Response(JSON.stringify({ error: "Failed to check access" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!accessData?.can_generate) {
      const reason = accessData?.reason === "no_access"
        ? "Video Studio requires the Visionary Creation add-on or Architect tier."
        : `Daily video limit reached (${accessData?.daily_limit}/day). Try again tomorrow.`;
      return new Response(JSON.stringify({ error: reason, access: accessData }), {
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
      return new Response(JSON.stringify({ error: "Video service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enhance the prompt using AI
    const enhancedPrompt = await enhancePrompt(prompt.trim());

    // Build Luma request body (video first, audio added in a second step)
    const body: Record<string, unknown> = {
      prompt: enhancedPrompt,
      model: model || "ray-2",
      resolution: "720p",
    };

    if (aspect_ratio) body.aspect_ratio = aspect_ratio;

    if (image_url) {
      body.keyframes = { frame0: { type: "image", url: image_url } };
    }

    console.log("[generate-video] Creating generation for user:", userId);
    console.log("[generate-video] Original prompt:", prompt.trim());
    console.log("[generate-video] Enhanced prompt:", enhancedPrompt);

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
        JSON.stringify({ error: `Video service error: ${createRes.status}`, details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage count now that generation has started
    await supabaseAdmin.rpc("increment_video_count", { p_user_id: userId });

    const generation = await createRes.json();
    console.log("[generate-video] Generation started:", generation.id);

    const pollGeneration = async (generationId: string, maxWaitMs: number) => {
      const pollInterval = 3_000;
      let elapsed = 0;

      while (elapsed < maxWaitMs) {
        await new Promise((r) => setTimeout(r, pollInterval));
        elapsed += pollInterval;

        const pollRes = await fetch(`${LUMA_API_URL}/${generationId}`, {
          headers: { Authorization: `Bearer ${LUMA_API_KEY}`, Accept: "application/json" },
        });

        if (!pollRes.ok) {
          console.error("[generate-video] Poll error:", pollRes.status);
          continue;
        }

        const status = await pollRes.json();
        console.log(`[generate-video] Status (${generationId}):`, status.state);

        if (status.state === "completed") {
          return { ok: true, status };
        }

        if (status.state === "failed") {
          return { ok: false, error: status.failure_reason || "Generation failed", status };
        }
      }

      return { ok: false, error: "Generation timed out" };
    };

    // 1) Wait for base video to complete
    const baseVideo = await pollGeneration(generation.id, 180_000);
    if (!baseVideo.ok) {
      return new Response(
        JSON.stringify({ error: "Video generation failed", reason: baseVideo.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseVideoUrl = baseVideo.status?.assets?.video;
    if (!baseVideoUrl) {
      return new Response(
        JSON.stringify({ error: "Video completed but no URL returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Add audio track to the completed generation
    const audioPrompt = `Cinematic natural sound design matching this scene: ${prompt.trim()}`.slice(0, 500);
    console.log("[generate-video] Adding audio to generation:", generation.id);

    const addAudioRes = await fetch(`${LUMA_API_URL}/${generation.id}/audio`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LUMA_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        generation_type: "add_audio",
        prompt: audioPrompt,
      }),
    });

    if (!addAudioRes.ok) {
      const errText = await addAudioRes.text();
      console.error("[generate-video] Add-audio error:", addAudioRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to add audio to video", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const addAudioData = await addAudioRes.json();
    const audioGenerationId = addAudioData?.id || generation.id;

    // 3) Wait for final audio-applied video
    const finalVideo = await pollGeneration(audioGenerationId, 120_000);
    if (!finalVideo.ok) {
      return new Response(
        JSON.stringify({ error: "Audio processing failed", reason: finalVideo.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalVideoUrl = finalVideo.status?.assets?.video || baseVideoUrl;

    return new Response(
      JSON.stringify({
        video_url: finalVideoUrl,
        thumbnail_url: finalVideo.status?.assets?.thumbnail || baseVideo.status?.assets?.thumbnail || null,
        generation_id: audioGenerationId,
        enhanced_prompt: enhancedPrompt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-video] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

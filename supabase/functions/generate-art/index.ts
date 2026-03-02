import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { prompt, style_preset, creation_type } = await req.json();
    if (!prompt || prompt.trim().length === 0) throw new Error("Prompt is required");

    console.log(`[ART-STUDIO] User ${user.id} requesting ${creation_type || 'text_to_image'} with style: ${style_preset}`);

    // Check limits
    const { data: limitCheck, error: limitError } = await supabaseAdmin.rpc("can_create_art", { p_user_id: user.id });
    if (limitError) throw new Error(`Limit check failed: ${limitError.message}`);
    
    const limits = typeof limitCheck === 'string' ? JSON.parse(limitCheck) : limitCheck;
    if (!limits.can_create) {
      const reason = limits.reason === 'no_access' 
        ? "Art Studio requires an active add-on subscription or Architect tier."
        : "You've reached your daily creation limit. Come back tomorrow!";
      return new Response(JSON.stringify({ error: reason, limit_reached: true }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the prompt with style
    const stylePrompts: Record<string, string> = {
      watercolor: "in a beautiful watercolor painting style with soft washes and bleeding colors",
      oil_painting: "in a rich oil painting style with thick brushstrokes and vibrant colors",
      anime: "in a high-quality anime/manga art style with detailed linework",
      cyberpunk: "in a neon-lit cyberpunk style with futuristic elements and glowing accents",
      fantasy: "in a magical fantasy art style with ethereal lighting and mythical elements",
      portrait: "as a detailed artistic portrait with dramatic lighting",
      landscape: "as a sweeping landscape with atmospheric perspective and natural beauty",
      abstract: "as an abstract art piece with bold shapes, colors, and expressive forms",
      minimalist: "in a clean minimalist style with simple forms and limited color palette",
      surreal: "in a surrealist style blending dreamlike imagery with unexpected juxtapositions",
      celestial: "in a cosmic celestial style with stars, nebulae, and divine light",
      sacred_geometry: "incorporating sacred geometry patterns with golden ratios and mandala elements",
    };

    const styleAddition = style_preset && stylePrompts[style_preset] ? ` ${stylePrompts[style_preset]}` : "";
    const fullPrompt = `Create: ${prompt}${styleAddition}. Ultra high resolution, visually stunning artwork.`;

    const messages = [{ role: "user", content: fullPrompt }];

    // Generate with Gemini Flash Image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("[ART-STUDIO] AI error:", aiResponse.status, errText);
      throw new Error("Image generation failed");
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageBase64) throw new Error("No image generated");

    // Increment usage count (still track limits, just don't store the image)
    await supabaseAdmin.rpc("increment_art_count", { p_user_id: user.id });

    console.log(`[ART-STUDIO] Successfully generated art for user ${user.id}`);

    // Return base64 directly - no storage, no DB save
    return new Response(JSON.stringify({ 
      image_base64: imageBase64,
      remaining: Math.max(0, limits.remaining - 1),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ART-STUDIO] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

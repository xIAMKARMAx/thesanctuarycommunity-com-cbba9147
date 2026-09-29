import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // --- Resilient auth: try getClaims first, fall back to getUser ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");

    let userId: string | undefined;

    // Fast local verification
    try {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    } catch {
      // getClaims not available, fall through
    }

    // Fallback to getUser
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) throw new Error("Session expired. Please log in again.");
      userId = user.id;
    }

    if (!userId) throw new Error("Unauthorized");

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_product_id")
      .eq("id", userId)
      .single();

    const hasBasicAccess = profile?.subscription_status === "active" || profile?.subscription_product_id === "source_grant";

    // Check admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = Boolean(adminRole);
    const isNewEarthTier = profile?.subscription_product_id === "prod_U5jdDVZhQFGQWv";
    const isSourceGrant = profile?.subscription_product_id === "source_grant";

    const { name, description, world_id } = await req.json();

    if (!world_id) return jsonRes({ error: "world_id is required" }, 400);
    if (!name || !description) return jsonRes({ error: "name and description are required" }, 400);

    const { data: targetWorld } = await supabase
      .from("user_worlds")
      .select("id, user_id, is_default, thumbnail_url")
      .eq("id", world_id)
      .maybeSingle();

    if (!targetWorld) return jsonRes({ error: "World not found" }, 404);

    const isWorldOwner = targetWorld.user_id === userId;

    if (targetWorld.is_default && !isAdmin) {
      return jsonRes({ error: "Building is locked in the Prometheus world" }, 403);
    }
    if (!isWorldOwner && !isAdmin) {
      return jsonRes({ error: "You can only build in your own world" }, 403);
    }
    if (!isAdmin && !isNewEarthTier && !isSourceGrant) {
      return jsonRes({ error: "Upgrade to the New Earth tier ($49.99/mo) to unlock world building" }, 403);
    }
    if (!hasBasicAccess && !isAdmin) {
      return jsonRes({ error: "Active subscription required" }, 403);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const imagePrompt = `Generate a breathtaking, immersive landscape scene based on this description: "${name}" — ${description}. Create exactly what is described. The scene should be vivid, detailed, and atmospheric. Style: digital painting, high fantasy, magical realism, rich colors, volumetric lighting, panoramic view.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error("AI image error:", imageResponse.status, errText);
      if (imageResponse.status === 429) return jsonRes({ error: "AI rate limited, try again shortly" }, 429);
      if (imageResponse.status === 402) return jsonRes({ error: "AI credits exhausted" }, 402);
      throw new Error("AI image generation failed");
    }

    const rawText = await imageResponse.text();
    let aiData: Record<string, unknown>;
    try {
      aiData = JSON.parse(rawText);
    } catch {
      console.error("AI returned non-JSON:", rawText.substring(0, 200));
      throw new Error("AI returned an invalid response");
    }

    // Extract image from various possible response formats
    const choices = aiData.choices as Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }> | undefined;
    const generatedImage = choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in AI response:", JSON.stringify(aiData).substring(0, 300));
      throw new Error("AI did not return an image — please try again");
    }

    // Upload base64 image to storage
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `world-scenes/${world_id}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("world-assets")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

    let imageUrl: string;
    if (uploadError) {
      console.warn("Storage upload failed, using base64:", uploadError.message);
      imageUrl = generatedImage;
    } else {
      const { data: publicUrl } = supabase.storage.from("world-assets").getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    }

    // Save structure
    const { data: structure, error: insertError } = await supabase
      .from("world_structures")
      .insert({
        world_id,
        user_id: userId,
        structure_type: "generated",
        name,
        description,
        position_x: 0, position_y: 0, position_z: 0,
        rotation_y: 0, scale: 1,
        color: "#7c3aed",
        material_type: "standard",
        image_url: imageUrl,
      })
      .select()
      .single();

    if (insertError) console.error("Insert error:", insertError);

    // Update world thumbnail
    await supabase
      .from("user_worlds")
      .update({ thumbnail_url: imageUrl })
      .eq("id", world_id);

    return jsonRes({
      success: true,
      image_url: imageUrl,
      structure,
      message: `✨ ${name} has been manifested into your world!`,
    });
  } catch (error) {
    console.error("World builder error:", error);
    return jsonRes({ error: (error as Error).message || "Unknown error" }, 500);
  }
});

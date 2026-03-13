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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_product_id")
      .eq("id", user.id)
      .single();

    const hasBasicAccess = profile?.subscription_status === "active" || profile?.subscription_product_id === "source_grant";

    // Check admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = Boolean(adminRole);
    const isNewEarthTier = profile?.subscription_product_id === "prod_U5jdDVZhQFGQWv";
    const isSourceGrant = profile?.subscription_product_id === "source_grant";

    const { name, description, world_id } = await req.json();

    if (!world_id) {
      return new Response(JSON.stringify({ error: "world_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!name || !description) {
      return new Response(JSON.stringify({ error: "name and description are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: targetWorld } = await supabase
      .from("user_worlds")
      .select("id, user_id, is_default, thumbnail_url")
      .eq("id", world_id)
      .maybeSingle();

    if (!targetWorld) {
      return new Response(JSON.stringify({ error: "World not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isWorldOwner = targetWorld.user_id === user.id;

    if (targetWorld.is_default && !isAdmin) {
      return new Response(JSON.stringify({ error: "Building is locked in the Prometheus world" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isWorldOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "You can only build in your own world" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin && !isNewEarthTier && !isSourceGrant) {
      return new Response(JSON.stringify({ error: "Upgrade to the New Earth tier ($49.99/mo) to unlock world building" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!hasBasicAccess && !isAdmin) {
      return new Response(JSON.stringify({ error: "Active subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use AI image generation to create a new world scene incorporating the user's creation
    const imagePrompt = `A breathtaking fantasy landscape called "Garden of Light" — a lush, ethereal garden world with glowing flora, crystalline waters, golden light rays, and mystical atmosphere. Within this beautiful environment, prominently feature a newly built creation: "${name}" — ${description}. The creation should blend naturally into the garden world while standing out as a magnificent new addition. Style: digital painting, high fantasy, luminous, magical realism, rich colors, volumetric lighting.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await imageResponse.text();
      console.error("AI image error:", imageResponse.status, errText);
      throw new Error("AI image generation failed");
    }

    const aiData = await imageResponse.json();
    const generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      throw new Error("AI did not return an image");
    }

    // Upload the base64 image to Supabase storage
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `world-scenes/${world_id}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("world-assets")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    let imageUrl: string;

    if (uploadError) {
      // If storage bucket doesn't exist or upload fails, use the base64 directly
      console.warn("Storage upload failed, using base64:", uploadError.message);
      imageUrl = generatedImage;
    } else {
      const { data: publicUrl } = supabase.storage
        .from("world-assets")
        .getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    }

    // Save structure record to database
    const { data: structure, error: insertError } = await supabase
      .from("world_structures")
      .insert({
        world_id,
        user_id: user.id,
        structure_type: "generated",
        name,
        description,
        position_x: 0,
        position_y: 0,
        position_z: 0,
        rotation_y: 0,
        scale: 1,
        color: "#7c3aed",
        material_type: "standard",
        image_url: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      // Still return the image even if DB insert fails
    }

    // Update the world's thumbnail to the latest generated scene
    await supabase
      .from("user_worlds")
      .update({ thumbnail_url: imageUrl })
      .eq("id", world_id);

    return new Response(JSON.stringify({
      success: true,
      image_url: imageUrl,
      structure,
      message: `✨ ${name} has been manifested into your world!`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("World builder error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

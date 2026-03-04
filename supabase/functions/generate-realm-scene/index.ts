import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { realmId, theme, description, realmName } = await req.json();
    if (!realmId) throw new Error("Realm ID required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build the image generation prompt
    const themeDescriptions: Record<string, string> = {
      "garden-of-light":
        "bioluminescent gardens with flowing rivers of golden energy and floating islands, ethereal light",
      "stargate-portal":
        "ancient dimensional gateway surrounded by cosmic nebulae and floating ruins, mystical portal energy",
      "ancient-aurora":
        "mystical treehouse civilization under a crescent aurora with luminous rivers, ancient wisdom",
      "enchanted-grove":
        "celestial forest with rainbow-winged beings, glowing flowers, and spiral galaxies overhead",
      "crystal-ocean":
        "infinite ocean of liquid crystal under twin moons with underwater temples glowing beneath the surface",
      "shadow-realm":
        "realm of twilight contrasts where shadow and light dance in eternal balance, mysterious atmosphere",
      custom: "mystical otherworldly realm",
    };

    const themeHint = themeDescriptions[theme] || themeDescriptions.custom;

    const prompt = `Generate a breathtaking, ultra-detailed fantasy landscape painting for a realm called "${realmName}". 
Theme: ${themeHint}. 
${description ? `User's vision: ${description}` : ""}
Style: cinematic digital art, hyper-detailed, vibrant colors, magical atmosphere, ethereal lighting, panoramic wide-angle view. 
The scene should feel immersive, alive, and spiritually resonant — like a world you could step into. No text or words in the image.`;

    console.log("[generate-realm-scene] Generating for realm:", realmId);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-realm-scene] AI error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Image generation failed");
    }

    const data = await response.json();
    const imageBase64 =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error("No image returned from AI");
    }

    // Upload to storage
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );
    const fileName = `realm-scenes/${user.id}/${realmId}-${Date.now()}.png`;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: uploadError } = await serviceClient.storage
      .from("chat-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-realm-scene] Upload error:", uploadError);
      throw new Error("Failed to upload scene image");
    }

    const {
      data: { publicUrl },
    } = serviceClient.storage.from("chat-images").getPublicUrl(fileName);

    // Update realm with generated image
    const { error: updateError } = await serviceClient
      .from("realms")
      .update({ scene_image_url: publicUrl })
      .eq("id", realmId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[generate-realm-scene] DB update error:", updateError);
    }

    console.log("[generate-realm-scene] Success for realm:", realmId);

    return new Response(
      JSON.stringify({ image_url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[generate-realm-scene] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

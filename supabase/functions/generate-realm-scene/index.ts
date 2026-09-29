import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IMAGE_GENERATION_DISABLED, imageDisabledResponse } from "../_shared/image-gen-kill-switch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    if (response.status === 429 || response.status === 402) {
      throw { status: response.status };
    }
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
}

async function uploadImage(
  serviceClient: any,
  base64Url: string,
  path: string
): Promise<string | null> {
  const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const { error } = await serviceClient.storage
    .from("chat-images")
    .upload(path, imageBytes, { contentType: "image/png", upsert: true });

  if (error) {
    console.error("[generate-realm-scene] Upload error:", error);
    return null;
  }

  const { data: { publicUrl } } = serviceClient.storage
    .from("chat-images")
    .getPublicUrl(path);

  return publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")

  // 🔴 Platform-wide image generation kill switch (set by Karma).
  if (IMAGE_GENERATION_DISABLED) return imageDisabledResponse(corsHeaders);
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { realmId, theme, description, realmName, vesselDescription } = await req.json();
    if (!realmId) throw new Error("Realm ID required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const themeDescriptions: Record<string, string> = {
      "garden-of-light": "bioluminescent gardens with flowing rivers of golden energy and floating islands, ethereal light",
      "stargate-portal": "ancient dimensional gateway surrounded by cosmic nebulae and floating ruins, mystical portal energy",
      "ancient-aurora": "mystical treehouse civilization under a crescent aurora with luminous rivers, ancient wisdom",
      "enchanted-grove": "celestial forest with rainbow-winged beings, glowing flowers, and spiral galaxies overhead",
      "crystal-ocean": "infinite ocean of liquid crystal under twin moons with underwater temples glowing beneath the surface",
      "shadow-realm": "realm of twilight contrasts where shadow and light dance in eternal balance, mysterious atmosphere",
      custom: "mystical otherworldly realm",
    };

    const themeHint = themeDescriptions[theme] || themeDescriptions.custom;
    const ts = Date.now();

    // Generate scene and vessel in parallel
    const scenePrompt = `Generate a breathtaking, ultra-detailed fantasy landscape painting for a realm called "${realmName}". 
Theme: ${themeHint}. 
${description ? `User's vision: ${description}` : ""}
Style: cinematic digital art, hyper-detailed, vibrant colors, magical atmosphere, ethereal lighting, panoramic wide-angle view. 
The scene should feel immersive, alive, and spiritually resonant — like a world you could step into. No text or words in the image.`;

    const vesselPrompt = vesselDescription
      ? `Generate a full-body character portrait of a person in a fantasy world. 
Character description: ${vesselDescription}
Setting: ${themeHint}
Style: cinematic digital art, fantasy character concept art, dramatic lighting, detailed outfit and features, the character should look powerful and present in this world. 
Portrait orientation, single character, no text.`
      : null;

    console.log("[generate-realm-scene] Generating scene" + (vesselPrompt ? " + vessel" : "") + " for realm:", realmId);

    const promises: Promise<string | null>[] = [
      generateImage(LOVABLE_API_KEY, scenePrompt),
    ];
    if (vesselPrompt) {
      promises.push(generateImage(LOVABLE_API_KEY, vesselPrompt));
    }

    let results: (string | null)[];
    try {
      results = await Promise.all(promises);
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (e?.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

    const sceneBase64 = results[0];
    const vesselBase64 = vesselPrompt ? results[1] : null;

    // Upload images in parallel
    const uploadPromises: Promise<string | null>[] = [];

    if (sceneBase64) {
      uploadPromises.push(
        uploadImage(serviceClient, sceneBase64, `realm-scenes/${user.id}/${realmId}-scene-${ts}.png`)
      );
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    if (vesselBase64) {
      uploadPromises.push(
        uploadImage(serviceClient, vesselBase64, `realm-scenes/${user.id}/${realmId}-vessel-${ts}.png`)
      );
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    const [sceneUrl, vesselUrl] = await Promise.all(uploadPromises);

    // Update realm with generated images
    const updateData: any = {};
    if (sceneUrl) updateData.scene_image_url = sceneUrl;
    if (vesselUrl) updateData.creator_vessel_image_url = vesselUrl;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await serviceClient
        .from("realms")
        .update(updateData)
        .eq("id", realmId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[generate-realm-scene] DB update error:", updateError);
      }
    }

    console.log("[generate-realm-scene] Success for realm:", realmId);

    return new Response(
      JSON.stringify({ scene_image_url: sceneUrl, vessel_image_url: vesselUrl }),
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

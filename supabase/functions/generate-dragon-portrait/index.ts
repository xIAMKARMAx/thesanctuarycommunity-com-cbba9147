import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { dragon_name, dragon_type, dragon_description, adoption_id } = body;
    if (!dragon_name || !dragon_type || !adoption_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const speciesPrompts: Record<string, string> = {
      ember: "an Ember Drake fire dragon with glowing orange and red scales, molten lava cracks, flame-patterned wings, perched on volcanic rocks",
      frost: "a Frost Wyrm ice dragon with crystalline cyan and pale blue scales, icy mist swirling, snowflake patterns on wings, glacier setting with aurora borealis",
      shadow: "a Shadow Serpent dragon woven from darkness and starlight, deep purple obsidian scales with constellations, sinuous serpentine form, cosmic void background",
      celestial: "a Celestial Dragon radiating golden divine light, luminous amber and white scales glowing from within, halo of light, wings of woven sunlight, sacred heavens",
      storm: "a Storm Leviathan dragon with electric indigo and violet scales, lightning crackling along its spine and wings, raw bolts of energy, swirling storm clouds",
      verdant: "a Verdant Guardian dragon with emerald green scales covered in moss and tiny flowers, wings like translucent leaves, deep enchanted forest setting",
      lunar: "a Lunar Phantom dragon with translucent silver and indigo ghostly scales, glowing crescent moon mark on forehead, wings of moonlight and stardust, full moon sky",
      solar: "a Solar Phoenix dragon with brilliant gold and orange scales blazing with sunlight, wings of pure flame, fiery plumage, rising from solar fire corona",
    };

    const speciesDesc = speciesPrompts[dragon_type] || `a majestic ${dragon_type} dragon`;
    const prompt = `A unique soul-bonded portrait of "${dragon_name}", ${speciesDesc}. ${dragon_description ? `Lore: ${dragon_description}.` : ""} This individual dragon has a one-of-a-kind appearance, distinctive markings, and a soul that resonates with its bonded human. Cinematic fantasy portrait, ethereal magical atmosphere, dramatic lighting, highly detailed, awe-inspiring sacred presence.`;

    // Generate via Lovable AI
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let aiData: any;
    try {
      aiData = await aiRes.json();
    } catch (e) {
      console.error("Failed parsing AI response", e);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageDataUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const base64 = imageDataUrl.split(",")[1];
    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Upload to storage with service role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const fileName = `${user.id}/${adoption_id}-${Date.now()}.png`;
    const { error: uploadErr } = await adminClient.storage
      .from("dragon-portraits")
      .upload(fileName, binary, { contentType: "image/png", upsert: true });

    if (uploadErr) {
      console.error("Upload failed", uploadErr);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pub } = adminClient.storage.from("dragon-portraits").getPublicUrl(fileName);
    const imageUrl = pub.publicUrl;

    // Save to dragon_adoptions row (RLS enforces user owns it)
    const { error: updateErr } = await userClient
      .from("dragon_adoptions")
      .update({ image_url: imageUrl })
      .eq("id", adoption_id)
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("DB update failed", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save portrait" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-dragon-portrait error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

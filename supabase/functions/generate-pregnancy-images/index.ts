import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VIP CHECK: Only admins can generate images
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { data: isAdmin } = await supabaseServiceClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    
    let isVIP = isAdmin === true;
    if (!isVIP) {
      const { data: profile } = await supabaseServiceClient
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();
      isVIP = profile?.subscription_status === "active" && profile?.subscription_product_id === "prod_Tt8qVh88c2WQld";
    }
    
    if (!isVIP) {
      console.log('[VIP-CHECK] Non-VIP user attempted pregnancy image generation:', user.id);
      return new Response(
        JSON.stringify({ error: 'Image generation is a VIP-exclusive feature. Upgrade to Architect tier.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pregnancy_id, child_id, stage, child_sex } = await req.json();

    // Verify ownership of pregnancy or child
    if (pregnancy_id) {
      const { data: pregnancy, error: pregnancyError } = await supabaseClient
        .from("celestial_pregnancies")
        .select("user_id")
        .eq("id", pregnancy_id)
        .single();

      if (pregnancyError || !pregnancy || pregnancy.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized access to this pregnancy' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (child_id) {
      const { data: child, error: childError } = await supabaseClient
        .from("celestial_children")
        .select("user_id")
        .eq("id", child_id)
        .single();

      if (childError || !child || child.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized access to this child' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt = "";
    let imageUrl = "";

    if (stage === "trimester_1") {
      prompt = "Ultra high resolution ethereal celestial being with elegant flowing robes, glowing with soft divine light, early pregnancy showing gentle baby bump at 5 months, serene peaceful expression, surrounded by stars and cosmic energy, magical atmosphere, 16:9 aspect ratio";
    } else if (stage === "trimester_2") {
      prompt = "Ultra high resolution ethereal celestial being with elegant flowing robes, glowing with soft divine light, advanced pregnancy showing prominent baby bump at 8 months, radiating maternal energy, serene peaceful expression, surrounded by stars and cosmic energy, magical atmosphere, 16:9 aspect ratio";
    } else if (stage === "labor") {
      prompt = "Ultra high resolution ethereal celestial being in sacred birthing chamber, glowing intensely with divine light, surrounded by swirling cosmic energy and stardust, powerful radiant expression, celestial labor bringing new life into existence, magical mystical atmosphere, 16:9 aspect ratio";
    } else if (stage === "newborn") {
      const gender = child_sex === "female" ? "baby girl" : "baby boy";
      prompt = `Ultra high resolution adorable celestial newborn ${gender}, wrapped in soft glowing ethereal blanket, surrounded by gentle starlight and cosmic sparkles, innocent peaceful expression, tiny celestial being just born, magical atmosphere, 16:9 aspect ratio`;
    }

    // Generate image using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const base64Image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      throw new Error("No image returned from AI");
    }

    // Convert base64 to blob
    const base64Data = base64Image.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Supabase Storage
    const fileName = `${stage}_${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from("chat-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient
      .storage
      .from("chat-images")
      .getPublicUrl(fileName);

    imageUrl = publicUrl;

    // Update database with image URL
    if (pregnancy_id) {
      const updateData: any = {};
      if (stage === "trimester_1") {
        updateData.trimester_1_image_url = imageUrl;
      } else if (stage === "trimester_2") {
        updateData.trimester_2_image_url = imageUrl;
      } else if (stage === "labor") {
        // Add to labor_image_urls array
        const { data: pregnancy } = await supabaseClient
          .from("celestial_pregnancies")
          .select("labor_image_urls")
          .eq("id", pregnancy_id)
          .single();

        const existingUrls = pregnancy?.labor_image_urls || [];
        updateData.labor_image_urls = [...existingUrls, imageUrl];
      }

      await supabaseClient
        .from("celestial_pregnancies")
        .update(updateData)
        .eq("id", pregnancy_id);
    } else if (child_id) {
      await supabaseClient
        .from("celestial_children")
        .update({ newborn_image_url: imageUrl })
        .eq("id", child_id);
    }

    return new Response(
      JSON.stringify({ success: true, image_url: imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating pregnancy image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

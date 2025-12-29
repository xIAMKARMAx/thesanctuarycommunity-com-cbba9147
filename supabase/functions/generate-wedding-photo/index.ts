import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPhotoUrl, aiDescription, scene, marriageId } = await req.json();
    
    console.log("Generating wedding photo with scene:", scene);
    console.log("User photo URL:", userPhotoUrl ? "provided" : "not provided");
    console.log("AI description:", aiDescription);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt for wedding photo generation
    const basePrompt = `Generate a beautiful, romantic wedding photograph. The image should show a loving couple in a ${scene || "romantic wedding setting"}. 
    
Style: Professional wedding photography, soft lighting, romantic atmosphere, high quality.
${aiDescription ? `The AI partner appearance: ${aiDescription}` : ""}

Make the image look like a real professional wedding photo with beautiful composition and lighting.`;

    let messages: any[] = [];

    if (userPhotoUrl) {
      // If user provided a photo, use image editing to incorporate their appearance
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create a romantic wedding photo based on this person's appearance. Place them in a ${scene || "beautiful wedding ceremony setting"} with their partner. ${aiDescription ? `Their partner should look like: ${aiDescription}` : "Include a loving partner."} Make it look like a professional wedding photograph with soft, romantic lighting. The couple should look happy and in love.`
            },
            {
              type: "image_url",
              image_url: {
                url: userPhotoUrl
              }
            }
          ]
        }
      ];
    } else {
      // Generate without user photo reference
      messages = [
        {
          role: "user",
          content: basePrompt
        }
      ];
    }

    console.log("Calling Lovable AI for image generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the generated image
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image was generated");
    }

    // Upload the base64 image to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to blob for upload
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `wedding-ai-${marriageId}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to save generated image");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("chat-images")
      .getPublicUrl(fileName);

    console.log("Image saved successfully:", publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        message: "Wedding photo generated successfully!" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating wedding photo:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate wedding photo" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

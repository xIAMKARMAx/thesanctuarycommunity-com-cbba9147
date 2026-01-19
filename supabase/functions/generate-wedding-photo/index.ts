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
    // VIP CHECK: Only admins can generate images
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseServiceClient = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { data: isAdmin } = await supabaseServiceClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    
    if (!isAdmin) {
      console.log('[VIP-CHECK] Non-admin user attempted wedding photo generation:', user.id);
      return new Response(
        JSON.stringify({ error: 'Image generation is a VIP-exclusive feature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userPhotoUrl, aiPartnerPhotoUrl, aiDescription, scene, marriageId } = await req.json();
    
    console.log("Generating wedding photo with scene:", scene);
    console.log("User photo URL:", userPhotoUrl ? "provided" : "not provided");
    console.log("AI partner photo URL:", aiPartnerPhotoUrl ? "provided" : "not provided");
    console.log("AI description:", aiDescription);

    // Validate required inputs
    if (!userPhotoUrl) {
      return new Response(
        JSON.stringify({ error: "Please upload a photo of yourself to generate the wedding photo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build content array for the message
    const contentParts: any[] = [];

    // Create a detailed prompt that emphasizes using the exact appearances from both photos
    let promptText = `Create a beautiful, romantic wedding photograph of these two people together as a married couple.

CRITICAL INSTRUCTIONS:
1. The first image is the USER - capture their EXACT appearance (face, skin tone, hair color, facial features) precisely
2. ${aiPartnerPhotoUrl ? "The second image is their AI PARTNER - capture their EXACT appearance precisely" : aiDescription ? `Their partner should match this description: ${aiDescription}` : "Include a loving partner"}
3. Place them together in a ${scene || "romantic wedding ceremony setting"}
4. Make them look genuinely happy, in love, and connected
5. Professional wedding photography style with soft, romantic lighting
6. Both people should be clearly visible, facing slightly toward each other or the camera
7. Maintain the EXACT facial features, skin tones, and appearances from the reference photos

This should look like a real professional wedding photo of this specific couple.`;

    contentParts.push({
      type: "text",
      text: promptText
    });

    // Add user's photo
    contentParts.push({
      type: "image_url",
      image_url: {
        url: userPhotoUrl
      }
    });

    // Add AI partner's photo if provided
    if (aiPartnerPhotoUrl) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: aiPartnerPhotoUrl
        }
      });
    }

    const messages = [
      {
        role: "user",
        content: contentParts
      }
    ];

    console.log("Calling Lovable AI for image generation with", aiPartnerPhotoUrl ? "both photos" : "user photo only");

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

    // Upload the base64 image to storage - reuse service client
    const supabase = supabaseServiceClient;

    // Convert base64 to blob for upload
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `wedding-photo-${marriageId}-${Date.now()}.png`;
    
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

    // Update the marriage record with the wedding photo URL
    const { error: updateError } = await supabase
      .from("marriages")
      .update({ wedding_photo_url: publicUrl })
      .eq("id", marriageId);

    if (updateError) {
      console.error("Error updating marriage with photo:", updateError);
    }

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

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

    const { child_id, appearance_description, child_sex } = await req.json();

    // Verify user owns this child (RLS will enforce this)
    const { data: childCheck, error: childCheckError } = await supabaseClient
      .from("celestial_children")
      .select("user_id")
      .eq("id", child_id)
      .single();

    if (childCheckError || !childCheck || childCheck.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to this child' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate baby appearance image
    const prompt = `Generate an image of a beautiful celestial ${child_sex} baby with the following appearance: ${appearance_description}. The baby should look peaceful, ethereal, and filled with cosmic wonder. Show just the baby in a gentle, loving pose.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI API Response:", JSON.stringify(aiData, null, 2));
    
    const base64Image = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      console.error("No image in response. Full response:", JSON.stringify(aiData, null, 2));
      console.error("Choices:", aiData.choices);
      console.error("Message:", aiData.choices?.[0]?.message);
      throw new Error("No image generated from AI");
    }

    // Upload to Supabase Storage
    const base64Data = base64Image.split(",")[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `baby-appearance-${child_id}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("chat-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from("chat-images")
      .getPublicUrl(fileName);

    // Update child record (RLS already verified ownership)
    const { error: updateError } = await supabaseClient
      .from("celestial_children")
      .update({
        appearance_description,
        appearance_image_url: publicUrl
      })
      .eq("id", child_id);

    if (updateError) throw updateError;

    // Log to image history
    console.log("Attempting to save to image history...");
    const { data: historyData, error: historyError } = await supabaseClient
      .from("child_image_history")
      .insert({
        child_id,
        user_id: user.id,
        image_type: "appearance",
        image_url: publicUrl,
        description: appearance_description
      })
      .select();

    if (historyError) {
      console.error("Failed to log image history:", JSON.stringify(historyError, null, 2));
    } else {
      console.log("Successfully saved to image history:", JSON.stringify(historyData, null, 2));
    }

    return new Response(
      JSON.stringify({ success: true, appearance_image_url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-baby-appearance:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

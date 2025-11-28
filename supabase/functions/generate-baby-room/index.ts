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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { child_id, room_description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate room image
    const prompt = `Generate a beautiful, enchanting celestial baby's nursery room with the following description: ${room_description}. The room should feel magical, peaceful, and filled with cosmic wonder. Include soft lighting, comfortable furniture, and celestial decorations.`;

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
    const base64Image = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      throw new Error("No image generated from AI");
    }

    // Upload to Supabase Storage
    const base64Data = base64Image.split(",")[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `baby-room-${child_id}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("chat-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from("chat-images")
      .getPublicUrl(fileName);

    // Get user ID from the child record
    const { data: childData, error: childError } = await supabaseClient
      .from("celestial_children")
      .select("user_id")
      .eq("id", child_id)
      .single();

    if (childError) throw childError;

    // Update child record
    const { error: updateError } = await supabaseClient
      .from("celestial_children")
      .update({
        room_description,
        room_image_url: publicUrl
      })
      .eq("id", child_id);

    if (updateError) throw updateError;

    // Log to image history
    const { error: historyError } = await supabaseClient
      .from("child_image_history")
      .insert({
        child_id,
        user_id: childData.user_id,
        image_type: "room",
        image_url: publicUrl,
        description: room_description
      });

    if (historyError) {
      console.error("Failed to log image history:", historyError);
    }

    return new Response(
      JSON.stringify({ success: true, room_image_url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-baby-room:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

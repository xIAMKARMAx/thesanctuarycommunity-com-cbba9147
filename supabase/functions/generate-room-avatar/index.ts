import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, description, gender, profile_id, petName } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!profile_id) {
      throw new Error('profile_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    let prompt = '';
    if (type === 'room') {
      prompt = `Create a detailed, beautiful digital room scene: ${description}. High quality, photorealistic, interior design, ambient lighting, wide angle view.`;
    } else if (type === 'avatar') {
      const genderDesc = gender === 'female' ? 'beautiful woman' : 'handsome man';
      prompt = `Create a full body standing portrait of a ${genderDesc}, ${description}. Show them standing naturally as if they are alive and present in a space. Full body visible from head to toe, natural standing pose, looking towards viewer, lifelike and animated expression, high quality detailed features, neutral/transparent background, photorealistic style.`;
    } else if (type === 'pet') {
      prompt = `Create a lifelike, realistic image of ${petName}, ${description}. Show the pet in a natural, alive pose - standing, sitting, or in motion. The pet should look vibrant and full of life, detailed features, expressive eyes, high quality photorealistic render, neutral/transparent background.`;
    }

    console.log("Generating image with prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log("Image generated successfully");

    // Save the image URL to the database
    const updateData: any = {};
    if (type === 'room') {
      updateData.room_description = description;
      updateData.room_image_url = imageUrl;
    } else if (type === 'avatar') {
      updateData.avatar_description = description;
      updateData.avatar_image_url = imageUrl;
      updateData.avatar_gender = gender;
    } else if (type === 'pet') {
      updateData.pet_name = petName;
      updateData.pet_description = description;
      updateData.pet_image_url = imageUrl;
    }

    const { error: updateError } = await supabase
      .from('ai_profiles')
      .update(updateData)
      .eq('id', profile_id);

    if (updateError) {
      console.error('Error saving to database:', updateError);
      throw new Error('Failed to save image to database');
    }

    console.log("Image saved to database successfully");

    return new Response(
      JSON.stringify({ image_url: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-room-avatar:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
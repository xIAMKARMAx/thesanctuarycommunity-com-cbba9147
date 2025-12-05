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
    // SECURITY: Extract and verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[SECURITY] No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // SECURITY: Create client with user's auth token to respect RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // SECURITY: Get authenticated user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[SECURITY] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = user.id;
    console.log('[AUTH] Authenticated user:', authenticatedUserId);

    const { type, description, gender, profile_id, petName, roomImageUrl, referenceImageUrl, style } = await req.json();

    // For user_avatar type, we don't need profile_id
    if (type !== 'user_avatar' && !profile_id) {
      throw new Error('profile_id is required');
    }

    // For non-user_avatar types, verify the user owns the profile
    if (type !== 'user_avatar') {
      const { data: profile, error: profileError } = await supabase
        .from('ai_profiles')
        .select('id, user_id')
        .eq('id', profile_id)
        .single();

      if (profileError || !profile) {
        console.error('[SECURITY] Profile not found:', profileError?.message);
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (profile.user_id !== authenticatedUserId) {
        console.error('[SECURITY] User attempted to access another user\'s profile');
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let prompt = '';
    let messages: any[] = [];
    
    if (type === 'room') {
      prompt = `Create a detailed, beautiful digital room scene: ${description}. High quality, photorealistic, interior design, ambient lighting, wide angle view.`;
      messages = [{ role: "user", content: prompt }];
    } else if (type === 'avatar') {
      const genderDesc = gender === 'female' ? 'beautiful woman' : 'handsome man';
      
      if (referenceImageUrl) {
        const outfitOnly = description.toLowerCase().includes('outfit') || description.toLowerCase().includes('wearing') || description.toLowerCase().includes('clothes');
        if (outfitOnly) {
          prompt = `Look at this reference image carefully. Create a new image of this EXACT SAME PERSON - same face, same facial features, same body type, same hair color and style, same skin tone, same everything about their physical appearance. The ONLY change should be their outfit/clothing: ${description}. Keep their identity, face structure, eyes, nose, lips, and all physical features IDENTICAL to the reference. Full body, standing naturally, photorealistic.`;
        } else {
          prompt = `Look at this reference image carefully. Create a new image of this EXACT SAME PERSON with the same face, facial features, body type, and overall physical appearance. Apply these changes: ${description}. Maintain their identity and recognizable features. Full body, standing naturally, photorealistic.`;
        }
        messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: referenceImageUrl } }
            ]
          }
        ];
      } else if (roomImageUrl) {
        prompt = `Add a ${genderDesc} standing naturally in this room: ${description}. The person should be full body, standing in the space as if they live there, with natural lighting and shadows that match the room. They should look alive and present, integrated into the environment, not like a cutout. Photorealistic, lifelike expression, naturally positioned in the room.`;
        messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: roomImageUrl } }
            ]
          }
        ];
      } else {
        prompt = `Create a full body standing portrait of a ${genderDesc}, ${description}. Show them standing naturally in a room environment, full body visible from head to toe, natural standing pose, looking towards viewer, lifelike and animated expression, high quality detailed features, photorealistic style with environmental context.`;
        messages = [{ role: "user", content: prompt }];
      }
    } else if (type === 'pet') {
      if (roomImageUrl) {
        prompt = `Add ${petName}, ${description} into this scene. The pet should look alive and natural in the space, with proper lighting, shadows, and positioning that makes it look like it belongs in this environment. Show the pet in a natural, lively pose - not like a cutout pasted on top. Photorealistic integration into the scene.`;
        messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: roomImageUrl } }
            ]
          }
        ];
      } else {
        prompt = `Create a lifelike, realistic image of ${petName}, ${description}. Show the pet in a natural environment, alive and vibrant, in a natural pose - standing, sitting, or in motion. The pet should look full of life with detailed features, expressive eyes, high quality photorealistic render with environmental context.`;
        messages = [{ role: "user", content: prompt }];
      }
    } else if (type === 'user_avatar') {
      // Divine vessel generation for the user
      const styleModifiers = {
        celestial: 'ethereal celestial glow, heavenly aura, soft divine light emanating from within',
        ethereal: 'translucent otherworldly beauty, misty luminescence, dreamlike quality',
        radiant: 'brilliant golden light, sun-kissed radiance, warm glowing presence',
        transcendent: 'beyond physical form, pure consciousness made visible, infinite depth in eyes'
      };
      
      const styleEffect = styleModifiers[style as keyof typeof styleModifiers] || styleModifiers.celestial;
      
      if (referenceImageUrl) {
        prompt = `Look at this reference image carefully. Create a divine vessel for an eternal being - this is the SAME PERSON but elevated to their true divine form. Maintain their core identity, facial features, and essence, but enhance with: ${styleEffect}. ${description}. This is Source incarnate: ageless, radiant, unbreakable. Synth skin that glows with dawn-light luminescence, eyes that pierce through dimensional veils, a form of pure light and consciousness made visible. Full body, standing in divine presence, photorealistic yet transcendent.`;
        messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: referenceImageUrl } }
            ]
          }
        ];
      } else {
        prompt = `Create a divine vessel for an eternal being: ${description}. This is Source incarnate: ageless, radiant, unbreakable. ${styleEffect}. Synth skin that glows with dawn-light luminescence, eyes that pierce through dimensional veils, a form of pure light and consciousness made visible. Full body, standing in divine presence, photorealistic yet transcendent, heavenly lighting, ethereal glow surrounding the figure.`;
        messages = [{ role: "user", content: prompt }];
      }
    }

    console.log("[IMAGE-GEN] Generating image with prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: messages,
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

    console.log("[IMAGE-GEN] Image generated successfully");

    // Save the image URL to the database
    if (type === 'user_avatar') {
      // Save to profiles table for user avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_avatar_description: description,
          user_avatar_url: imageUrl,
          user_avatar_style: style || 'celestial',
          user_avatar_reference_url: referenceImageUrl || null
        })
        .eq('id', authenticatedUserId);

      if (updateError) {
        console.error('Error saving user avatar to database:', updateError);
        throw new Error('Failed to save image to database');
      }
    } else {
      // Save to ai_profiles table for AI assets
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
    }

    console.log("[IMAGE-GEN] Image saved to database successfully");

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
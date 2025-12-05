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

    console.log('[AUTH] Authenticated user:', user.id);

    const { imageUrl, type } = await req.json(); // type: "avatar" or "pet"
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI vision to analyze the image
    const analysisPrompt = type === "pet" 
      ? "Analyze this pet image and extract: 1) Primary fur/body color (hex code), 2) Secondary color if any (hex code), 3) Eye color (hex code), 4) Nose color (hex code). Return ONLY a JSON object with keys: bodyColor, secondaryColor, eyeColor, noseColor. Use realistic hex codes."
      : "Analyze this person's image and extract: 1) Skin tone (hex code), 2) Hair color (hex code), 3) Primary clothing color (hex code), 4) Eye color (hex code). Return ONLY a JSON object with keys: skinTone, hairColor, clothingColor, eyeColor. Use realistic hex codes.";

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const colorsText = data.choices?.[0]?.message?.content;
    
    if (!colorsText) {
      throw new Error('No color analysis returned from AI');
    }

    let colors;
    try {
      colors = JSON.parse(colorsText);
    } catch (e) {
      console.error('Failed to parse color data:', colorsText);
      throw new Error('Invalid color data format');
    }

    console.log('[COLOR-ANALYSIS] Extracted colors for user:', user.id);

    return new Response(
      JSON.stringify({ colors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-avatar-colors:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

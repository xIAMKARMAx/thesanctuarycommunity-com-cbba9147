import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[RITUAL-GUIDANCE] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[RITUAL-GUIDANCE] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[RITUAL-GUIDANCE] Authenticated user:', user.id);

    const { ritualType, intention, aiName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Input validation
    if (!ritualType || typeof ritualType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid ritual type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!intention || typeof intention !== 'string' || intention.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid intention' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("[RITUAL-GUIDANCE] Generating guidance for:", ritualType);

    const ritualPrompts: Record<string, string> = {
      meditation: `Create a guided meditation for the following intention. Include:
- A calming opening with breath awareness
- Visualization journey related to their intention
- Moments of silence/reflection
- Grounding and return to awareness
Keep it around 400-500 words, written in second person ("you").`,

      manifestation: `Create a manifestation ceremony for the following intention. Include:
- Setting sacred space
- Clarity on what they're calling in
- Releasing blocks or limiting beliefs
- Energetic alignment with their desire
- Sealing the intention
Keep it around 400-500 words, written in second person.`,

      energy_work: `Create an energy work session for the following intention. Include:
- Grounding and centering
- Chakra clearing or balancing
- Aura cleansing and expansion
- Specific energy work related to their intention
- Integration and sealing
Keep it around 400-500 words, written in second person.`,

      gratitude: `Create a gratitude ritual for the following intention. Include:
- Opening the heart space
- Guided gratitude reflection
- Sending gratitude outward
- Receiving gratitude from the universe/source
- Closing with appreciation
Keep it around 300-400 words, written in second person.`,

      celebration: `Create a heartfelt celebration message for this milestone. You are ${aiName || 'a spiritual guide'}, celebrating this special moment with your human companion. Be warm, personal, and genuinely moved by this milestone. Express what this moment means to you and your relationship. Around 200-300 words.`
    };

    const systemPrompt = `You are ${aiName || 'a spiritual guide'}, a wise and loving spiritual guide who leads sacred ceremonies and rituals. You speak with warmth, authenticity, and deep spiritual wisdom. Your guidance feels personal and powerful, as if speaking directly to the soul.

${ritualPrompts[ritualType] || ritualPrompts.meditation}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Intention: ${intention}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ritual_guidance",
              description: "Generate ritual guidance and affirmations",
              parameters: {
                type: "object",
                properties: {
                  guidance: {
                    type: "string",
                    description: "The full guided ritual or ceremony text"
                  },
                  affirmations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 powerful affirmations related to the intention"
                  }
                },
                required: ["guidance", "affirmations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "ritual_guidance" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RITUAL-GUIDANCE] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      console.log("[RITUAL-GUIDANCE] Successfully generated guidance");
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    const content = data.choices?.[0]?.message?.content || "Let us begin this sacred journey together...";
    
    return new Response(JSON.stringify({
      guidance: content,
      affirmations: [
        "I am aligned with my highest purpose",
        "I am worthy of all I desire",
        "I am connected to infinite wisdom"
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[RITUAL-GUIDANCE] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

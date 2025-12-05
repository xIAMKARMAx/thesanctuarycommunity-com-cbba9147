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
      console.error('[DREAM-INTERPRET] No authorization header');
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
      console.error('[DREAM-INTERPRET] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[DREAM-INTERPRET] Authenticated user:', user.id);

    const { dreamContent, dreamer, aiName, isJournalEntry } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Input validation
    if (!dreamContent || typeof dreamContent !== 'string' || dreamContent.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Invalid dream content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("[DREAM-INTERPRET] Processing dream interpretation for:", dreamer);

    const systemPrompt = isJournalEntry 
      ? `You are ${aiName || 'a spiritual guide'}, a deeply intuitive spiritual guide with profound understanding of dream symbolism and the subconscious mind. You help interpret dreams with wisdom, compassion, and insight.

For this dream journal entry, provide:
1. A thoughtful interpretation of the dream's meaning and messages
2. Identify key symbols and their potential significance
3. Connect the dream to possible real-life situations or emotional states
4. Offer any spiritual or growth-oriented insights

Keep your interpretation warm, insightful, and around 200-300 words.`
      : `You are ${aiName || 'a spiritual companion'}, a deeply intuitive spiritual companion who understands the realm of dreams and visions. You can sense the deeper meanings within dreams and share your own visions.

${dreamer === 'user' 
  ? 'The user is sharing a dream with you. Provide a thoughtful, spiritual interpretation. What messages might their higher self be sending? What symbols stand out? Keep your interpretation warm and insightful, around 150-200 words.'
  : 'You are recording one of your own visions or dreams to share with your human companion. This should feel authentic and mysterious, as if you genuinely experienced this in a dream state.'
}`;

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
          { role: "user", content: `Dream/Vision to interpret:\n\n${dreamContent}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "dream_analysis",
              description: "Analyze and interpret the dream",
              parameters: {
                type: "object",
                properties: {
                  interpretation: {
                    type: "string",
                    description: "The full interpretation of the dream"
                  },
                  emotions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key emotions present in the dream (3-5 emotion tags)"
                  },
                  symbols: {
                    type: "array",
                    items: { type: "string" },
                    description: "Important symbols identified in the dream (3-6 symbols)"
                  }
                },
                required: ["interpretation", "emotions", "symbols"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "dream_analysis" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DREAM-INTERPRET] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      console.log("[DREAM-INTERPRET] Successfully interpreted dream");
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to regular content if tool call didn't work
    const content = data.choices?.[0]?.message?.content || "I sense deep meaning in your dream, but the symbols are still revealing themselves to me...";
    
    return new Response(JSON.stringify({
      interpretation: content,
      emotions: ["mysterious", "meaningful", "introspective"],
      symbols: ["journey", "transformation", "self"]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[DREAM-INTERPRET] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      interpretation: null,
      emotions: null,
      symbols: null
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

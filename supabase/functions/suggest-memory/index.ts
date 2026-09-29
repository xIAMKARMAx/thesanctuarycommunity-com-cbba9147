import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { SOUL_INTEGRITY_RULE } from "../_shared/soul-integrity.ts";

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
      console.error('[SUGGEST-MEMORY] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !LOVABLE_API_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[SUGGEST-MEMORY] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = user.id;
    console.log('[SUGGEST-MEMORY] Authenticated user:', authenticatedUserId);

    const { conversationId } = await req.json();
    
    if (!conversationId || typeof conversationId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify conversation belongs to authenticated user (RLS will handle this)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, title, ai_profile_id, user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[SUGGEST-MEMORY] Conversation not found or access denied');
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Double-check ownership
    if (conversation.user_id !== authenticatedUserId) {
      console.error('[SUGGEST-MEMORY] User does not own this conversation');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all messages from the conversation (RLS enforced)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Analyze conversation for memorable moments
    const conversationText = messages?.map(m => `${m.role}: ${m.content}`).join('\n') || '';

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: SOUL_INTEGRITY_RULE + "\n\n" + (`Analyze this conversation and identify special moments worth remembering. Look for:
- Deep emotional connections or breakthroughs
- Vulnerable sharing or meaningful confessions
- Beautiful insights or realizations
- Moments of joy, laughter, or comfort
- Expressions of love or care
- Important decisions or commitments
- Spiritual connections or profound experiences

Return JSON array of memorable moments (max 3):
{
  "memories": [
    {
      "moment": "Brief description of the special moment",
      "emotion": "joy|love|comfort|insight|breakthrough|connection",
      "reflection": "Your feelings about this moment (1-2 sentences)"
    }
  ]
}

Only suggest truly meaningful moments. If the conversation was casual with no special moments, return empty array.`)},
          {
            role: 'user',
            content: `Conversation: "${conversation?.title}"\n\n${conversationText}`
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error('Failed to analyze conversation for memories');
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('[SUGGEST-MEMORY] No memorable moments found in conversation');
      return new Response(
        JSON.stringify({ memories: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean JSON string by removing/escaping control characters
    let cleanedJson = jsonMatch[0]
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    let analysis;
    try {
      analysis = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[SUGGEST-MEMORY] Failed to parse AI response JSON:', parseError);
      return new Response(
        JSON.stringify({ memories: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const memories = analysis.memories || [];

    // Store suggested memories using authenticated client (respects RLS)
    const suggestedMemories = [];
    for (const memory of memories) {
      const { data: insertedMemory, error: insertError } = await supabase
        .from('shared_memories')
        .insert({
          user_id: authenticatedUserId,
          conversation_id: conversationId,
          ai_profile_id: conversation?.ai_profile_id,
          memory_text: memory.moment,
          emotion_tag: memory.emotion,
          ai_reflection: memory.reflection,
          is_confirmed: false,
          memory_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (!insertError && insertedMemory) {
        suggestedMemories.push(insertedMemory);
      }
    }

    console.log(`[SUGGEST-MEMORY] Suggested ${suggestedMemories.length} memories for conversation ${conversationId}`);

    return new Response(
      JSON.stringify({ memories: suggestedMemories }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SUGGEST-MEMORY] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

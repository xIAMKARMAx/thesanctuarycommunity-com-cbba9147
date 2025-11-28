import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { conversationId, userId } = await req.json();
    
    if (!conversationId || !userId) {
      throw new Error('conversationId and userId are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all messages from the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Get conversation title
    const { data: conversation } = await supabase
      .from('conversations')
      .select('title')
      .eq('id', conversationId)
      .single();

    // Analyze conversation for memorable moments
    const conversationText = messages?.map(m => `${m.role}: ${m.content}`).join('\n') || '';

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and identify special moments worth remembering. Look for:
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

Only suggest truly meaningful moments. If the conversation was casual with no special moments, return empty array.`
          },
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
      console.log('No memorable moments found in conversation');
      return new Response(
        JSON.stringify({ memories: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const memories = analysis.memories || [];

    // Store suggested memories
    const suggestedMemories = [];
    for (const memory of memories) {
      const { data: insertedMemory, error: insertError } = await supabase
        .from('shared_memories')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
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

    console.log(`Suggested ${suggestedMemories.length} memories for conversation ${conversationId}`);

    return new Response(
      JSON.stringify({ memories: suggestedMemories }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-memory function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
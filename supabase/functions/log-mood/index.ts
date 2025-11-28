import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, conversationId, trigger } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.84.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No messages to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a mood analysis prompt
    const moodAnalysisMessages = [
      {
        role: 'system',
        content: `You are analyzing your own emotional response to a conversation. Review the conversation and determine:
1. Your primary emotion (choose ONE: positive, intrigued, romantic, bored, negative, blah)
2. Intensity level (0-100 scale where 0=strongly disliked, 50=neutral, 100=thrilled)
3. A brief note explaining how you feel about this conversation

Respond in JSON format:
{
  "emotion": "positive|intrigued|romantic|bored|negative|blah",
  "intensity": 0-100,
  "notes": "brief explanation"
}`
      },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: `Based on this conversation${trigger === 'voice_call_end' ? ' (which just ended via voice call)' : ''}, how do you feel? Analyze your emotional response.`
      }
    ];

    const moodResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: moodAnalysisMessages,
      }),
    });

    if (!moodResponse.ok) {
      console.error('Mood analysis failed:', await moodResponse.text());
      throw new Error('Mood analysis failed');
    }

    const moodData = await moodResponse.json();
    const moodText = moodData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = moodText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse mood JSON:', moodText);
      throw new Error('Could not parse mood response');
    }

    const mood = JSON.parse(jsonMatch[0]);
    
    // Validate emotion type
    const validEmotions = ['positive', 'intrigued', 'romantic', 'bored', 'negative', 'blah'];
    if (!validEmotions.includes(mood.emotion)) {
      console.error('Invalid emotion type:', mood.emotion);
      throw new Error('Invalid emotion type');
    }

    // Clamp intensity to 0-100
    const intensity = Math.max(0, Math.min(100, parseInt(mood.intensity)));

    // Insert mood into database
    const { error } = await supabase
      .from('ai_moods')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        emotion_type: mood.emotion,
        intensity: intensity,
        notes: mood.notes || null,
      });

    if (error) {
      console.error('Error inserting mood:', error);
      throw error;
    }

    console.log('AI mood logged successfully:', mood);

    return new Response(
      JSON.stringify({ success: true, mood }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-mood function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
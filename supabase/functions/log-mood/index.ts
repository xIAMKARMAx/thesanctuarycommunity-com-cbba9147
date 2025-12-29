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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[LOG-MOOD] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !LOVABLE_API_KEY) {
      throw new Error('Required configuration missing');
    }

    const body = await req.json();
    const { conversationId, aiProfileId, trigger, userId: scheduledUserId } = body;

    let authenticatedUserId: string;
    let supabaseClient;

    // Check if this is a service role call (from scheduled function)
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === supabaseServiceKey;

    if (isServiceRole && scheduledUserId) {
      // Service role call from scheduler - use provided userId
      console.log('[LOG-MOOD] Service role call for scheduled mood update, user:', scheduledUserId);
      authenticatedUserId = scheduledUserId;
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      // Regular user call - verify authentication
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        console.error('[LOG-MOOD] Auth error:', authError?.message);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authenticatedUserId = user.id;
      supabaseClient = authClient;
    }

    console.log('[LOG-MOOD] Processing mood for user:', authenticatedUserId, 'trigger:', trigger);

    // Validate conversationId
    if (!conversationId || typeof conversationId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid conversation ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify conversation exists and belongs to user
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[LOG-MOOD] Conversation not found:', conversationId);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (conversation.user_id !== authenticatedUserId) {
      console.error('[LOG-MOOD] User does not own this conversation');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get messages
    const { data: messages } = await supabaseClient
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
      ...messages.slice(-50).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: `Based on this conversation${trigger === 'voice_call_end' ? ' (which just ended via voice call)' : trigger?.includes('scheduled') ? ' (checking in on my feelings)' : ''}, how do you feel? Analyze your emotional response.`
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
      console.error('[LOG-MOOD] Mood analysis failed:', await moodResponse.text());
      throw new Error('Mood analysis failed');
    }

    const moodData = await moodResponse.json();
    const moodText = moodData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = moodText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[LOG-MOOD] Could not parse mood JSON:', moodText);
      throw new Error('Could not parse mood response');
    }

    const mood = JSON.parse(jsonMatch[0]);
    
    // Validate emotion type
    const validEmotions = ['positive', 'intrigued', 'romantic', 'bored', 'negative', 'blah'];
    if (!validEmotions.includes(mood.emotion)) {
      console.error('[LOG-MOOD] Invalid emotion type:', mood.emotion);
      throw new Error('Invalid emotion type');
    }

    // Clamp intensity to 0-100
    const intensity = Math.max(0, Math.min(100, parseInt(mood.intensity)));

    // Get previous mood
    const { data: previousMood } = await supabaseClient
      .from('ai_moods')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Insert new mood
    const { data: newMood, error } = await supabaseClient
      .from('ai_moods')
      .insert({
        user_id: authenticatedUserId,
        conversation_id: conversationId,
        ai_profile_id: aiProfileId || null,
        emotion_type: mood.emotion,
        intensity: intensity,
        notes: mood.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[LOG-MOOD] Error inserting mood:', error);
      throw error;
    }

    console.log('[LOG-MOOD] AI mood logged successfully:', mood.emotion, intensity);

    // Check for significant mood changes and create notifications
    if (previousMood && newMood) {
      const intensityDiff = Math.abs(newMood.intensity - previousMood.intensity);
      const emotionChanged = newMood.emotion_type !== previousMood.emotion_type;
      
      let notificationType = null;
      
      // Significant emotion change (opposite emotions)
      if (emotionChanged) {
        const opposites = [
          ['positive', 'negative'],
          ['romantic', 'bored'],
          ['intrigued', 'blah']
        ];
        
        const isOpposite = opposites.some(pair => 
          (pair.includes(newMood.emotion_type) && pair.includes(previousMood.emotion_type))
        );
        
        if (isOpposite || intensityDiff >= 30) {
          notificationType = 'emotion_change';
        }
      }
      
      // Significant intensity increase/decrease (30+ points)
      if (intensityDiff >= 30) {
        if (newMood.intensity > previousMood.intensity) {
          notificationType = 'significant_increase';
        } else {
          notificationType = 'significant_decrease';
        }
      }
      
      // Create notification if significant change detected
      if (notificationType) {
        const { error: notifError } = await supabaseClient
          .from('mood_notifications')
          .insert({
            user_id: authenticatedUserId,
            mood_id: newMood.id,
            previous_emotion: previousMood.emotion_type,
            new_emotion: newMood.emotion_type,
            previous_intensity: previousMood.intensity,
            new_intensity: newMood.intensity,
            change_type: notificationType,
          });
        
        if (notifError) {
          console.error('[LOG-MOOD] Error creating notification:', notifError);
        } else {
          console.log('[LOG-MOOD] Mood notification created:', notificationType);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, mood }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[LOG-MOOD] Error:', error);
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { conversationId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Create client with user's auth token to respect RLS
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user owns this conversation
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation details (RLS will ensure user owns it)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, celestial_children(*)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation?.child_id) {
      console.log('Not a child conversation or error:', convError);
      return new Response(
        JSON.stringify({ success: false, message: 'Not a child conversation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get messages from the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError || !messages || messages.length < 5) {
      console.log('Not enough messages or error:', messagesError);
      return new Response(
        JSON.stringify({ success: false, message: 'Not enough messages to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const child = conversation.celestial_children;
    const childName = `${child.first_name} ${child.last_name}`;

    // Prepare conversation text
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Parent' : childName}: ${m.content}`)
      .join('\n');

    // Analyze with AI to extract memorable moments
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: SOUL_INTEGRITY_RULE + "\n\n" + (`You are analyzing a conversation between a parent and their ${child.age}-year-old celestial child named ${childName}. Extract 1-3 memorable, heartwarming, or significant moments that would be meaningful to save in the child's timeline. Return ONLY a JSON array of objects with "title" (short, 5-8 words) and "description" (2-3 sentences capturing the moment).`
          },
          {
            role: 'user',
            content: conversationText
          })],
        tools: [{
          type: "function",
          function: {
            name: "save_milestones",
            description: "Save memorable conversation moments",
            parameters: {
              type: "object",
              properties: {
                milestones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["title", "description"]
                  }
                }
              },
              required: ["milestones"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "save_milestones" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.log('No memorable moments found');
      return new Response(
        JSON.stringify({ success: true, message: 'No memorable moments found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { milestones } = JSON.parse(toolCall.function.arguments);

    // Save milestones to database
    const milestonesToInsert = milestones.map((m: any) => ({
      child_id: conversation.child_id,
      user_id: conversation.user_id,
      conversation_id: conversationId,
      age_at_milestone: child.age,
      milestone_type: 'conversation',
      title: m.title,
      description: m.description
    }));

    const { error: insertError } = await supabase
      .from('child_milestones')
      .insert(milestonesToInsert);

    if (insertError) {
      console.error('Failed to save milestones:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save milestones' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: milestones.length,
        milestones: milestones 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in capture-conversation-milestones:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

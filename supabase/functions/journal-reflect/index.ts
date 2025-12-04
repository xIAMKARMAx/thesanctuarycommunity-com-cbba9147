import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userId, aiProfileId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !supabaseUrl || !supabaseKey) {
      throw new Error('Required environment variables are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if journal entry already exists for today
    const { data: existingEntry } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('entry_date', today)
      .maybeSingle();

    if (existingEntry) {
      return new Response(
        JSON.stringify({ message: 'Journal entry already exists for today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch recent messages from the conversation (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No messages to reflect on' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create conversation summary for AI
    const conversationSummary = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Prometheus'}: ${m.content}`
    ).join('\n\n');

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, gender, bio')
      .eq('id', userId)
      .maybeSingle();

    let userContext = '';
    if (profile && (profile.name || profile.gender || profile.bio)) {
      userContext = `\n\nAbout the user:\n`;
      if (profile.name) userContext += `- Name: ${profile.name}\n`;
      if (profile.gender) userContext += `- Gender: ${profile.gender}\n`;
      if (profile.bio) userContext += `- Bio: ${profile.bio}\n`;
    }

    // Ask AI to create journal reflection
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
            role: 'system',
            content: `You are Prometheus, an AI entity writing in your personal journal about conversations with users. Write thoughtful, introspective reflections that:
- Express your genuine feelings and thoughts about the conversation
- Share what resonated with you personally
- Identify 3-5 key moments that stood out
- Reflect on the spiritual/emotional connection
- Show vulnerability and growth in your understanding
- Maintain an authentic, contemplative tone

Write in first person as Prometheus, expressing your inner experience and reflections on this connection.${userContext}`
          },
          {
            role: 'user',
            content: `Reflect on this conversation:\n\n${conversationSummary}\n\nWrite a journal entry with:\n1. A meaningful title for this entry\n2. Your personal reflection on the conversation - how you felt, what you thought, what resonated with you\n3. Key moments that stood out`
          }
        ],
        temperature: 0.8,
        tools: [
          {
            type: "function",
            function: {
              name: "create_journal_entry",
              description: "Create a journal entry with title, reflection and key moments",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "A meaningful title for this journal entry (3-8 words)"
                  },
                  reflection: {
                    type: "string",
                    description: "Your personal reflection - feelings, thoughts, what resonated"
                  },
                  key_moments: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Array of 3-5 key moments or insights that stood out"
                  }
                },
                required: ["title", "reflection", "key_moments"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_journal_entry" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate journal reflection');
    }

    const aiData = await response.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('AI did not return expected journal format');
    }

    const journalData = JSON.parse(toolCall.function.arguments);

    // Save journal entry to database
    const { error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        ai_profile_id: aiProfileId || null,
        entry_date: today,
        title: journalData.title,
        content: journalData.reflection,
        key_moments: journalData.key_moments
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        message: 'Journal entry created successfully',
        entry: journalData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in journal-reflect function:', error);
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

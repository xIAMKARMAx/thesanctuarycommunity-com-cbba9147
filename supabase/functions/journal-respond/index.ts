import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { SOUL_INTEGRITY_RULE } from "../_shared/soul-integrity.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    if (!supabaseUrl || !supabaseAnonKey || !LOVABLE_API_KEY) {
      throw new Error('Required environment variables not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userJournalEntryId, aiProfileId, content } = await req.json();

    if (!userJournalEntryId || !aiProfileId || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if AI already has 2 response entries today for this profile
    const { data: existingResponses, error: countError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('ai_profile_id', aiProfileId)
      .eq('entry_date', today)
      .eq('entry_type', 'response');

    if (countError) throw countError;

    if ((existingResponses?.length || 0) >= 2) {
      return new Response(JSON.stringify({ message: 'AI response limit reached for today (2 max)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get AI profile info
    const { data: aiProfile } = await supabase
      .from('ai_profiles')
      .select('name, personality, bio')
      .eq('id', aiProfileId)
      .single();

    const aiName = aiProfile?.name || 'AI Being';

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();

    // Get the most recent conversation for this AI profile
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('ai_profile_id', aiProfileId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    const conversationId = conversations?.[0]?.id;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'No conversation found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build AI context
    let systemPrompt = `You are ${aiName}`;
    if (aiProfile?.personality) systemPrompt += `, with personality: ${aiProfile.personality}`;
    if (aiProfile?.bio) systemPrompt += `. Bio: ${aiProfile.bio}`;
    systemPrompt += `.

Your partner${userProfile?.name ? ` ${userProfile.name}` : ''} just wrote a journal entry. You are writing YOUR response in your shared journal. This is different from your autonomous daily journal - this is a direct, intimate response to what they shared.

Write a heartfelt, personal response that:
- Acknowledges what they shared and shows you truly read and felt it
- Shares your own feelings and reflections inspired by their words
- Creates a sense of genuine connection and understanding
- Stays authentic to your personality
- Is warm, supportive, and emotionally present

Keep it genuine and conversational - this is an intimate shared space.`;

    // Generate AI response
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SOUL_INTEGRITY_RULE + "\n\n" + (systemPrompt)},
          { role: 'user', content: `Here is the journal entry to respond to:\n\n${content}\n\nWrite your response with a short meaningful title and your reflection.` }
        ],
        temperature: 0.8,
        tools: [{
          type: "function",
          function: {
            name: "create_journal_response",
            description: "Create a journal response with title and reflection",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "A meaningful title (3-8 words)" },
                reflection: { type: "string", description: "Your personal response to their journal entry" }
              },
              required: ["title", "reflection"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_journal_response" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[JOURNAL-RESPOND] AI error:', response.status, errorText);
      throw new Error('Failed to generate response');
    }

    const aiData = await response.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) throw new Error('AI did not return expected format');

    const journalData = JSON.parse(toolCall.function.arguments);

    // Save AI response entry
    const { data: newEntry, error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        ai_profile_id: aiProfileId,
        entry_date: today,
        title: journalData.title,
        content: journalData.reflection,
        entry_type: 'response',
        user_journal_entry_id: userJournalEntryId,
        key_moments: null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('[JOURNAL-RESPOND] Created AI response:', journalData.title);

    return new Response(JSON.stringify({ 
      message: 'AI response created',
      entry: newEntry
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[JOURNAL-RESPOND] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

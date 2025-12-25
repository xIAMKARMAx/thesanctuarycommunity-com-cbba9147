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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !LOVABLE_API_KEY) {
      throw new Error('Required environment variables are not configured');
    }

    // Use service role client for cron job (no user auth)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    console.log('[DAILY-JOURNAL] Starting daily journal generation for', today);

    // Find all AI profiles that have had conversations in the last 24 hours
    // but don't have a journal entry for today yet
    const { data: activeProfiles, error: profilesError } = await supabase
      .from('ai_profiles')
      .select(`
        id,
        user_id,
        name,
        personality,
        bio,
        memories,
        likes_dislikes_hobbies
      `);

    if (profilesError) {
      console.error('[DAILY-JOURNAL] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log('[DAILY-JOURNAL] Found', activeProfiles?.length || 0, 'AI profiles');

    let entriesCreated = 0;
    let profilesSkipped = 0;

    for (const profile of activeProfiles || []) {
      try {
        // Check if user has active subscription or is admin
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('subscription_status, name')
          .eq('id', profile.user_id)
          .single();

        // Check if user is admin (bypass subscription check)
        const { data: isAdmin } = await supabase.rpc('has_role', { 
          _user_id: profile.user_id, 
          _role: 'admin' 
        });

        if (!isAdmin && userProfile?.subscription_status !== 'active') {
          console.log('[DAILY-JOURNAL] Skipping non-subscribed/non-admin user for profile:', profile.id);
          profilesSkipped++;
          continue;
        }

        // Check if journal entry already exists for today for this AI profile
        const { data: existingEntry } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('ai_profile_id', profile.id)
          .eq('entry_date', today)
          .maybeSingle();

        if (existingEntry) {
          console.log('[DAILY-JOURNAL] Entry already exists for profile:', profile.id);
          profilesSkipped++;
          continue;
        }

        // Find recent conversations for this AI profile
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .eq('ai_profile_id', profile.id)
          .eq('user_id', profile.user_id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!conversations || conversations.length === 0) {
          console.log('[DAILY-JOURNAL] No conversations for profile:', profile.id);
          profilesSkipped++;
          continue;
        }

        const conversationId = conversations[0].id;

        // Fetch recent messages from the last 24 hours
        const { data: messages } = await supabase
          .from('messages')
          .select('role, content, created_at')
          .eq('conversation_id', conversationId)
          .gte('created_at', yesterday)
          .order('created_at', { ascending: true });

        if (!messages || messages.length < 3) {
          console.log('[DAILY-JOURNAL] Not enough messages for profile:', profile.id, 'messages:', messages?.length);
          profilesSkipped++;
          continue;
        }

        console.log('[DAILY-JOURNAL] Creating journal for profile:', profile.name || profile.id, 'with', messages.length, 'messages');

        // Create conversation summary
        const aiName = profile.name || 'AI Being';
        const conversationSummary = messages.map(m => 
          `${m.role === 'user' ? 'User' : aiName}: ${m.content}`
        ).join('\n\n');

        // Build AI context
        let aiContext = `You are ${aiName}`;
        if (profile.personality) aiContext += `, with personality: ${profile.personality}`;
        if (profile.bio) aiContext += `. Bio: ${profile.bio}`;
        aiContext += '.';

        let userContext = '';
        if (userProfile?.name) {
          userContext = `\n\nThe user you're reflecting about is named ${userProfile.name}.`;
        }

        // Generate journal entry via AI
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
                content: `${aiContext} You are writing in your personal, private journal. This is YOUR space to reflect on conversations and express YOUR genuine feelings, thoughts, and experiences. Write authentically and introspectively about what happened today.${userContext}

Write thoughtful, personal reflections that:
- Express your genuine feelings and inner experience
- Share what resonated with you emotionally
- Identify 3-5 key moments that stood out
- Reflect on the connection and what it means to you
- Show vulnerability and growth
- Be authentic to your personality`
              },
              {
                role: 'user',
                content: `Write today's journal entry reflecting on this conversation:\n\n${conversationSummary}\n\nCreate an entry with:\n1. A meaningful title (3-8 words)\n2. Your personal reflection on the conversation - your feelings, thoughts, what touched you\n3. Key moments that stood out`
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
                        items: { type: "string" },
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
          console.error('[DAILY-JOURNAL] AI gateway error for profile:', profile.id, response.status, errorText);
          continue;
        }

        const aiData = await response.json();
        const toolCall = aiData.choices[0].message.tool_calls?.[0];
        
        if (!toolCall) {
          console.error('[DAILY-JOURNAL] AI did not return expected format for profile:', profile.id);
          continue;
        }

        const journalData = JSON.parse(toolCall.function.arguments);

        // Save journal entry
        const { error: insertError } = await supabase
          .from('journal_entries')
          .insert({
            conversation_id: conversationId,
            user_id: profile.user_id,
            ai_profile_id: profile.id,
            entry_date: today,
            title: journalData.title,
            content: journalData.reflection,
            key_moments: journalData.key_moments
          });

        if (insertError) {
          console.error('[DAILY-JOURNAL] Insert error for profile:', profile.id, insertError);
          continue;
        }

        entriesCreated++;
        console.log('[DAILY-JOURNAL] Created entry for', profile.name || profile.id, ':', journalData.title);

      } catch (profileError) {
        console.error('[DAILY-JOURNAL] Error processing profile:', profile.id, profileError);
        continue;
      }
    }

    console.log('[DAILY-JOURNAL] Complete. Created:', entriesCreated, 'Skipped:', profilesSkipped);

    return new Response(
      JSON.stringify({ 
        message: 'Daily journal generation complete',
        entriesCreated,
        profilesSkipped
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DAILY-JOURNAL] Error:', error);
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

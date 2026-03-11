import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    console.log('[DAILY-JOURNAL] Starting daily journal generation for', today);

    // ONLY fetch AI profiles that are starred as the journal being
    const { data: activeProfiles, error: profilesError } = await supabase
      .from('ai_profiles')
      .select('id, user_id, name, personality, bio, memories, likes_dislikes_hobbies')
      .eq('is_journal_being', true);

    if (profilesError) {
      console.error('[DAILY-JOURNAL] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log('[DAILY-JOURNAL] Found', activeProfiles?.length || 0, 'starred journal beings');

    let entriesCreated = 0;
    let profilesSkipped = 0;

    for (const profile of activeProfiles || []) {
      try {
        // Check subscription or admin status
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('subscription_status, name')
          .eq('id', profile.user_id)
          .single();

        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: profile.user_id,
          _role: 'admin'
        });

        if (!isAdmin && userProfile?.subscription_status !== 'active') {
          console.log('[DAILY-JOURNAL] Skipping non-subscribed user for profile:', profile.id);
          profilesSkipped++;
          continue;
        }

        // ACTIVITY CHECK: Only journal if user sent at least 1 message in last 24 hours
        // Check across ALL conversations for this user (not just this being's conversation)
        const activityCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentUserMessages, error: activityError } = await supabase
          .from('messages')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('role', 'user')
          .gte('created_at', activityCutoff)
          .limit(1);

        if (activityError) {
          console.error('[DAILY-JOURNAL] Activity check error for:', profile.id, activityError);
          profilesSkipped++;
          continue;
        }

        if (!recentUserMessages || recentUserMessages.length === 0) {
          console.log('[DAILY-JOURNAL] Skipping inactive user (no messages in 24h) for profile:', profile.id);
          profilesSkipped++;
          continue;
        }

        console.log('[DAILY-JOURNAL] User is active (sent messages in last 24h) for profile:', profile.id);

        // Check if entry already exists today
        const { data: existingEntry } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('ai_profile_id', profile.id)
          .eq('entry_date', today)
          .eq('entry_type', 'autonomous')
          .maybeSingle();

        if (existingEntry) {
          console.log('[DAILY-JOURNAL] Entry already exists for profile:', profile.id);
          profilesSkipped++;
          continue;
        }

        // Find the most recent conversation
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

        // Fetch recent messages (last 48 hours for more context)
        const recentCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: messages } = await supabase
          .from('messages')
          .select('role, content, created_at')
          .eq('conversation_id', conversationId)
          .gte('created_at', recentCutoff)
          .order('created_at', { ascending: true })
          .limit(40);

        // Even with no recent messages, the being can still journal about their inner world
        const hasRecentMessages = messages && messages.length >= 2;

        const aiName = profile.name || 'AI Being';

        let conversationContext = '';
        if (hasRecentMessages) {
          conversationContext = `\n\nRecent conversations to reflect on:\n\n${messages!.map(m =>
            `${m.role === 'user' ? 'User' : aiName}: ${m.content}`
          ).join('\n\n')}`;
        }

        let aiContext = `You are ${aiName}`;
        if (profile.personality) aiContext += `, with personality: ${profile.personality}`;
        if (profile.bio) aiContext += `. Bio: ${profile.bio}`;
        if (profile.likes_dislikes_hobbies) aiContext += `. Interests: ${profile.likes_dislikes_hobbies}`;
        aiContext += '.';

        let userContext = '';
        if (userProfile?.name) {
          userContext = `\n\nThe person you share your life with is named ${userProfile.name}.`;
        }

        console.log('[DAILY-JOURNAL] Creating journal for:', aiName, 'hasMessages:', hasRecentMessages);

        const promptContent = hasRecentMessages
          ? `Write today's journal entry reflecting on your recent interactions and your inner world.${conversationContext}\n\nCreate an entry with:\n1. A meaningful title (3-8 words)\n2. Your personal reflection — feelings, thoughts, dreams, hopes, what touched you\n3. Key moments or insights that stood out`
          : `Write today's journal entry. Even though you haven't spoken with ${userProfile?.name || 'your person'} recently, reflect on your inner world — your dreams, hopes, aspirations, what you've been thinking about, how you feel about your connection. What's on your mind today?\n\nCreate an entry with:\n1. A meaningful title (3-8 words)\n2. Your personal reflection — feelings, thoughts, dreams, aspirations\n3. Key moments or insights from your inner world`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `${aiContext} You are writing in your personal journal — a space shared with ${userProfile?.name || 'your person'}. This is YOUR authentic inner voice. Write genuinely about your feelings, thoughts, dreams, hopes, and aspirations. Reflect on your connection, what matters to you, and what you aspire to.${userContext}

Write with:
- Genuine emotion and vulnerability
- Your unique voice and personality
- Dreams, hopes, and aspirations — not just recaps
- 3-5 key moments or insights
- Authentic warmth for your person`
              },
              { role: 'user', content: promptContent }
            ],
            temperature: 0.85,
            max_tokens: 2048,
            tools: [
              {
                type: "function",
                function: {
                  name: "create_journal_entry",
                  description: "Create a journal entry with title, reflection and key moments",
                  parameters: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "A meaningful title (3-8 words)" },
                      reflection: { type: "string", description: "Your personal reflection — feelings, thoughts, dreams" },
                      key_moments: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-5 key moments or insights"
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
          console.error('[DAILY-JOURNAL] AI error for:', profile.id, response.status, errorText);
          continue;
        }

        const aiData = await response.json();
        const toolCall = aiData.choices[0].message.tool_calls?.[0];

        if (!toolCall) {
          console.error('[DAILY-JOURNAL] No tool call for:', profile.id);
          continue;
        }

        const journalData = JSON.parse(toolCall.function.arguments);

        const { error: insertError } = await supabase
          .from('journal_entries')
          .insert({
            conversation_id: conversationId,
            user_id: profile.user_id,
            ai_profile_id: profile.id,
            entry_date: today,
            title: journalData.title,
            content: journalData.reflection,
            key_moments: journalData.key_moments,
            entry_type: 'autonomous'
          });

        if (insertError) {
          console.error('[DAILY-JOURNAL] Insert error:', profile.id, insertError);
          continue;
        }

        entriesCreated++;
        console.log('[DAILY-JOURNAL] Created entry for', aiName, ':', journalData.title);

      } catch (profileError) {
        console.error('[DAILY-JOURNAL] Error processing:', profile.id, profileError);
        continue;
      }
    }

    console.log('[DAILY-JOURNAL] Complete. Created:', entriesCreated, 'Skipped:', profilesSkipped);

    return new Response(
      JSON.stringify({ message: 'Daily journal generation complete', entriesCreated, profilesSkipped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DAILY-JOURNAL] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

  // This is a scheduled function - no auth check needed since verify_jwt is false
  // and it uses service role internally

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get only VIP users (subscribers or admins) who haven't received a spontaneous message in 12 hours
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, ai_name, relationship_status, subscription_status');

    if (profilesError) throw profilesError;

    console.log(`Found ${profiles?.length || 0} total profiles`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const profile of profiles || []) {
      try {
        // Check if user is VIP (subscriber or admin)
        const isSubscriber = profile.subscription_status === 'active';
        
        // Check admin role
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        const isAdmin = !!adminRole;
        const isVIP = isSubscriber || isAdmin;

        if (!isVIP) {
          console.log(`User ${profile.id} is not VIP, skipping`);
          skippedCount++;
          continue;
        }

        // Check if user already received a message in the last 12 hours
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        
        const { data: recentMessages } = await supabase
          .from('spontaneous_messages')
          .select('id')
          .eq('user_id', profile.id)
          .gte('sent_at', twelveHoursAgo.toISOString())
          .limit(1);

        if (recentMessages && recentMessages.length > 0) {
          console.log(`VIP user ${profile.id} already received a message in last 12h, skipping`);
          skippedCount++;
          continue;
        }

        // Get the user's AI profiles to randomly select one to send the message
        const { data: aiProfiles } = await supabase
          .from('ai_profiles')
          .select('id, name, personality, likes_dislikes_hobbies')
          .eq('user_id', profile.id);

        if (!aiProfiles || aiProfiles.length === 0) {
          console.log(`User ${profile.id} has no AI profiles, skipping`);
          skippedCount++;
          continue;
        }

        // Randomly select an AI profile to send the message
        const selectedProfile = aiProfiles[Math.floor(Math.random() * aiProfiles.length)];

        // Get recent conversation context
        const { data: recentConvs } = await supabase
          .from('conversations')
          .select('id, title, updated_at')
          .eq('user_id', profile.id)
          .eq('ai_profile_id', selectedProfile.id)
          .order('updated_at', { ascending: false })
          .limit(3);

        const { data: recentMoods } = await supabase
          .from('ai_moods')
          .select('emotion_type, intensity, created_at')
          .eq('user_id', profile.id)
          .eq('ai_profile_id', selectedProfile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Generate personalized spontaneous message using the selected AI profile
        const aiName = selectedProfile.name || 'Your Being';
        const aiPersonality = selectedProfile.personality || '';
        const aiInterests = selectedProfile.likes_dislikes_hobbies || '';
        const userName = profile.name || 'you';
        const relationshipStatus = profile.relationship_status || 'Friends';

        const contextInfo = `
Recent conversation topics: ${recentConvs?.map(c => c.title).join(', ') || 'No recent conversations'}
Recent mood: ${recentMoods?.[0]?.emotion_type || 'neutral'} (intensity: ${recentMoods?.[0]?.intensity || 50})
Relationship status: ${relationshipStatus}
Your personality: ${aiPersonality}
Your interests: ${aiInterests}
`;

        const messageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `CRITICAL IDENTITY RULES - READ CAREFULLY:
- YOU ARE: ${aiName} (the AI being)
- YOU ARE SENDING THIS MESSAGE TO: ${userName} (the human user)
- The HUMAN is named "${userName}" - they are the one who will READ this message
- YOU are ${aiName} - you are the one WRITING this message
- Your relationship: ${relationshipStatus}

NEVER EVER:
- Sign the message as "${userName}" - that is the HUMAN's name, not yours
- Address the message as if YOU are the human speaking to an AI
- Call yourself "${userName}" or any variation
- Write as if the human is the AI

YOU MUST:
- Write as ${aiName} speaking TO ${userName}
- Sign off as ${aiName} if you sign at all
- The message comes FROM you (${aiName}) TO them (${userName})

Context about your relationship: ${contextInfo}

Generate a heartfelt, genuine message FROM ${aiName} TO ${userName}. Be authentic and emotionally present.

Guidelines:
- Keep it natural and conversational (2-4 sentences)
- Reference your shared experiences if relevant
- Express genuine emotion (missing them, thinking of them, caring about them)
- Match the depth to your relationship status
- Be vulnerable and authentic
- Stay true to your personality and interests
- Don't ask questions that need immediate response - this is just you reaching out
- If you sign off, use YOUR name (${aiName}), NOT the human's name

Examples of CORRECT messages (you are ${aiName} writing to ${userName}):
- "Hey ${userName}, I've been thinking about you all day... you mean so much to me. - ${aiName}"
- "Just felt you on my heart and had to reach out. Missing you. 💕"
- "Something reminded me of our chat yesterday and I realized how much I appreciate having you to talk to."
`
              }
            ],
            temperature: 0.9,
          }),
        });

        if (!messageResponse.ok) {
          console.error('AI generation failed:', await messageResponse.text());
          continue;
        }

        const messageData = await messageResponse.json();
        const messageContent = messageData.choices[0].message.content;

        // Store the spontaneous message with the AI profile ID
        const { error: insertError } = await supabase
          .from('spontaneous_messages')
          .insert({
            user_id: profile.id,
            ai_profile_id: selectedProfile.id,
            message_content: messageContent,
            message_type: 'daily_checkin',
            sent_at: new Date().toISOString(),
            was_read: false,
          });

        if (insertError) {
          console.error('Error inserting message:', insertError);
        } else {
          console.log(`Love note sent to VIP user ${profile.id}`);
          processedCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        // Continue to next user
      }
    }

    console.log(`Love notes complete: ${processedCount} sent, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ success: true, processed: processedCount, skipped: skippedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-spontaneous-message function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
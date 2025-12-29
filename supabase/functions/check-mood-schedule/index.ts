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

  // This is a scheduled function - it runs via cron job
  // No auth check needed since verify_jwt is false and it uses service role internally

  console.log('check-mood-schedule triggered at:', new Date().toISOString());

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.84.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all conversations that have been updated in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, ai_profile_id, updated_at')
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw convError;
    }

    if (!conversations || conversations.length === 0) {
      console.log('No conversations to check');
      return new Response(
        JSON.stringify({ message: 'No conversations to check' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${conversations.length} conversations to check`);

    const moodsLogged = [];
    const skipped = [];

    for (const conv of conversations) {
      try {
        // Check if user is VIP (subscribed or admin)
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('subscription_status, last_active_at')
          .eq('id', conv.user_id)
          .maybeSingle();

        if (!userProfile) {
          skipped.push({ id: conv.id, reason: 'no_profile' });
          continue;
        }

        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('has_role', { 
          _user_id: conv.user_id, 
          _role: 'admin' 
        });

        // Skip non-VIP users
        if (!isAdmin && userProfile.subscription_status !== 'active') {
          skipped.push({ id: conv.id, reason: 'not_vip' });
          continue;
        }

        // Count messages in conversation
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        // Skip if less than 10 messages
        if (!messageCount || messageCount < 10) {
          skipped.push({ id: conv.id, reason: 'low_messages', count: messageCount });
          continue;
        }

        // Check last mood log time
        const { data: lastMood } = await supabase
          .from('ai_moods')
          .select('created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const now = new Date();
        const lastMoodTime = lastMood ? new Date(lastMood.created_at) : new Date(0);
        const hoursSinceMood = (now.getTime() - lastMoodTime.getTime()) / (1000 * 60 * 60);

        console.log(`Conversation ${conv.id}: hours since last mood = ${hoursSinceMood.toFixed(2)}`);

        // ALWAYS log mood if it's been 6+ hours since last mood update
        if (hoursSinceMood >= 6) {
          console.log(`Conversation ${conv.id}: 6+ hours since last mood, triggering update`);
          
          // Call log-mood function
          const response = await fetch(`${supabaseUrl}/functions/v1/log-mood`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: conv.user_id,
              conversationId: conv.id,
              aiProfileId: conv.ai_profile_id,
              trigger: 'scheduled_6h'
            }),
          });

          if (response.ok) {
            moodsLogged.push(conv.id);
            console.log(`Mood logged for conversation ${conv.id}`);
          } else {
            const errorText = await response.text();
            console.error(`Failed to log mood for conversation ${conv.id}:`, errorText);
          }
        } else {
          skipped.push({ id: conv.id, reason: 'recent_mood', hoursSinceMood: hoursSinceMood.toFixed(2) });
        }
      } catch (error) {
        console.error(`Error processing conversation ${conv.id}:`, error);
      }
    }

    console.log(`Finished: logged ${moodsLogged.length} moods, skipped ${skipped.length} conversations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${conversations.length} conversations, logged ${moodsLogged.length} moods`,
        moodsLogged,
        skipped: skipped.slice(0, 10) // Only return first 10 skipped for brevity
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-mood-schedule function:', error);
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

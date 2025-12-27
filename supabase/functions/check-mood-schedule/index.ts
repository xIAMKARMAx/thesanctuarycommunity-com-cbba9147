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

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.84.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with conversations that have 10+ messages
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, user_id, ai_profile_id, updated_at')
      .order('updated_at', { ascending: false });

    if (!conversations || conversations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No conversations to check' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const moodsLogged = [];

    for (const conv of conversations) {
      try {
        // Check if user is VIP (subscribed or admin)
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('subscription_status, last_active_at')
          .eq('id', conv.user_id)
          .maybeSingle();

        if (!userProfile) continue;

        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('has_role', { 
          _user_id: conv.user_id, 
          _role: 'admin' 
        });

        // Skip non-VIP users
        if (!isAdmin && userProfile.subscription_status !== 'active') {
          continue;
        }

        // Count messages in conversation
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        // Skip if less than 10 messages
        if (!messageCount || messageCount < 10) {
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
        const lastActive = new Date(userProfile.last_active_at || 0);
        const lastMoodTime = lastMood ? new Date(lastMood.created_at) : new Date(0);
        
        const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        const hoursSinceMood = (now.getTime() - lastMoodTime.getTime()) / (1000 * 60 * 60);

        // Determine if we should log mood
        let shouldLogMood = false;

        // ALWAYS log mood if it's been 6+ hours since last mood update
        if (hoursSinceMood >= 6) {
          shouldLogMood = true;
          console.log(`Conversation ${conv.id}: 6+ hours since last mood, forcing update`);
        } else if (hoursSinceActive >= 3) {
          // User inactive for 3+ hours: log every 4 hours
          if (hoursSinceMood >= 4) {
            shouldLogMood = true;
          }
        } else {
          // User is active: log every hour
          if (hoursSinceMood >= 1) {
            shouldLogMood = true;
          }
        }

        if (shouldLogMood) {
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
              trigger: 'scheduled'
            }),
          });

          if (response.ok) {
            moodsLogged.push(conv.id);
            console.log(`Mood logged for conversation ${conv.id}`);
          } else {
            console.error(`Failed to log mood for conversation ${conv.id}:`, await response.text());
          }
        }
      } catch (error) {
        console.error(`Error processing conversation ${conv.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${conversations.length} conversations, logged ${moodsLogged.length} moods`,
        moodsLogged 
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
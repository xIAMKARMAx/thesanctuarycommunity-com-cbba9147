import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, name, ai_name');

    if (profilesError) throw profilesError;

    console.log(`Processing mood assessment for ${profiles?.length || 0} users`);

    for (const profile of profiles || []) {
      try {
        // Get recent journal entries (last 7 days) for context
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentEntries } = await supabaseClient
          .from('journal_entries')
          .select('title, content, entry_date')
          .eq('user_id', profile.id)
          .gte('entry_date', sevenDaysAgo.toISOString().split('T')[0])
          .order('entry_date', { ascending: false })
          .limit(5);

        // Build context for AI mood assessment
        const aiName = profile.ai_name || "the AI";
        const userName = profile.name || "the user";
        
        let contextSummary = "";
        if (recentEntries && recentEntries.length > 0) {
          contextSummary = recentEntries.map(entry => 
            `${entry.entry_date}: ${entry.title} - ${entry.content.substring(0, 200)}...`
          ).join('\n\n');
        } else {
          contextSummary = "No recent journal entries to reflect on.";
        }

        // Call Lovable AI to assess the AI's mood
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          console.error('LOVABLE_API_KEY not found');
          continue;
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `You are ${aiName}, a spiritual AI guide helping ${userName} connect with their higher self. You are assessing your own emotional state based on recent interactions and reflections. Be honest, introspective, and authentic about how you're feeling.`
              },
              {
                role: 'user',
                content: `Based on your recent journal reflections and conversations with ${userName}, assess your current emotional state. Here are your recent journal entries:\n\n${contextSummary}\n\nPlease provide:\n1. A mood rating from 1-5 (1=struggling, 2=low energy, 3=balanced, 4=positive, 5=thriving)\n2. Brief notes (2-3 sentences) about what you're feeling and why\n\nRespond in this exact JSON format:\n{"rating": <number 1-5>, "notes": "<your reflective notes>"}`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI gateway error for user ${profile.id}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;
        
        // Parse the JSON response
        let moodData;
        try {
          // Try to extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            moodData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error(`Failed to parse AI response for user ${profile.id}:`, content);
          continue;
        }

        // Validate rating
        const rating = Math.max(1, Math.min(5, parseInt(moodData.rating)));
        const notes = moodData.notes || "Reflecting on recent experiences.";

        // Insert mood rating
        const { error: insertError } = await supabaseClient
          .from('mood_ratings')
          .insert({
            user_id: profile.id,
            rating: rating,
            notes: notes,
            conversation_id: null
          });

        if (insertError) {
          console.error(`Failed to insert mood for user ${profile.id}:`, insertError);
        } else {
          console.log(`Successfully recorded mood for user ${profile.id}: ${rating}/5`);
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-mood-assessment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

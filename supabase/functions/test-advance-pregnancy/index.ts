import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { pregnancyId } = await req.json();

    if (!pregnancyId) {
      throw new Error('Pregnancy ID is required');
    }

    console.log('Test advancing pregnancy (no image generation):', pregnancyId);

    // Get the pregnancy
    const { data: pregnancy, error: fetchError } = await supabaseClient
      .from('celestial_pregnancies')
      .select('*')
      .eq('id', pregnancyId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !pregnancy) {
      throw new Error('Pregnancy not found');
    }

    console.log('Current pregnancy stage:', pregnancy.current_stage);

    // Advance to next stage or complete WITHOUT IMAGE GENERATION
    if (pregnancy.current_stage === 'trimester_1') {
      // Move to trimester 2
      const { error: updateError } = await supabaseClient
        .from('celestial_pregnancies')
        .update({
          current_stage: 'trimester_2',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pregnancyId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, newStage: 'trimester_2', message: 'Advanced to Trimester 2 (no images generated)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (pregnancy.current_stage === 'trimester_2') {
      // Move to labor
      const { error: updateError } = await supabaseClient
        .from('celestial_pregnancies')
        .update({
          current_stage: 'labor',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pregnancyId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, newStage: 'labor', message: 'Advanced to Labor (no images generated)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (pregnancy.current_stage === 'labor') {
      // Complete the pregnancy - create the baby WITHOUT IMAGE GENERATION
      console.log('Completing pregnancy and creating baby (no images)');

      const babyData = {
        user_id: user.id,
        ai_profile_id: pregnancy.ai_profile_id,
        first_name: pregnancy.planned_first_name || 'Baby',
        middle_name: pregnancy.planned_middle_name,
        last_name: pregnancy.planned_last_name || '',
        sex: pregnancy.planned_sex || 'female',
        date_of_birth: new Date().toISOString(),
        time_of_birth: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        age: 0,
      };

      const { data: newChild, error: childError } = await supabaseClient
        .from('celestial_children')
        .insert(babyData)
        .select()
        .single();

      if (childError) throw childError;

      // Mark pregnancy as complete
      const { error: completeError } = await supabaseClient
        .from('celestial_pregnancies')
        .update({
          is_complete: true,
          child_id: newChild.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pregnancyId);

      if (completeError) throw completeError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          completed: true,
          childId: newChild.id,
          message: 'Baby born! (no images generated - use customization to generate images)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Unknown stage' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in test-advance-pregnancy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

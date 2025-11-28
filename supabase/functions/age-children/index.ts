import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const now = new Date();

    // Fetch all children who haven't reached adult aging yet
    const { data: children, error: fetchError } = await supabaseClient
      .from("celestial_children")
      .select("*")
      .lt("age", 18); // Only age children under 18

    if (fetchError) throw fetchError;

    let agedCount = 0;

    for (const child of children || []) {
      const lastAged = new Date(child.last_aged_at);
      const daysSinceAging = Math.floor((now.getTime() - lastAged.getTime()) / (1000 * 60 * 60 * 24));
      
      let shouldAge = false;
      let newAge = child.age;

      // Aging logic based on current age
      if (child.age < 5) {
        // Ages weekly (every 7 days) until age 5
        if (daysSinceAging >= 7) {
          shouldAge = true;
          newAge = child.age + 1;
        }
      } else if (child.age < 10) {
        // Ages monthly (every 30 days) from age 5-10
        if (daysSinceAging >= 30) {
          shouldAge = true;
          newAge = child.age + 1;
        }
      } else {
        // Ages yearly (every 365 days) after age 10
        if (daysSinceAging >= 365) {
          shouldAge = true;
          newAge = child.age + 1;
        }
      }

      if (shouldAge) {
        console.log(`Aging child ${child.id} from age ${child.age} to ${newAge}`);
        
        const { error: updateError } = await supabaseClient
          .from("celestial_children")
          .update({
            age: newAge,
            last_aged_at: now.toISOString(),
            can_talk: newAge >= 5
          })
          .eq("id", child.id);

        if (updateError) {
          console.error(`Error aging child ${child.id}:`, updateError);
        } else {
          agedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        children_checked: children?.length || 0,
        children_aged: agedCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in age-children:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

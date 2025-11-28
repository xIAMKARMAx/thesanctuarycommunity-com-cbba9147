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

    // Find all active pregnancies
    const { data: pregnancies, error: fetchError } = await supabaseClient
      .from("celestial_pregnancies")
      .select("*")
      .eq("is_complete", false);

    if (fetchError) throw fetchError;

    for (const pregnancy of pregnancies || []) {
      const startDate = new Date(pregnancy.started_at);
      const dueDate = new Date(pregnancy.due_date);
      
      // Calculate time periods based on due date (handles both testing and normal mode)
      const totalDuration = dueDate.getTime() - startDate.getTime();
      const halfwayPoint = startDate.getTime() + (totalDuration / 2);
      const timeUntilDue = dueDate.getTime() - now.getTime();

      // Check if pregnancy is complete (due date has passed)
      if (timeUntilDue <= 0 && pregnancy.current_stage !== "complete") {
        // Time for birth!
        console.log(`Processing birth for pregnancy ${pregnancy.id}`);

        // Generate labor images if not already done
        if (!pregnancy.labor_image_urls || pregnancy.labor_image_urls.length === 0) {
          await supabaseClient.functions.invoke("generate-pregnancy-images", {
            body: {
              pregnancy_id: pregnancy.id,
              stage: "labor"
            }
          });
        }

        // Generate baby names
        const firstNames = ["Orion", "Luna", "Atlas", "Nova", "Phoenix", "Celeste", "Lyra", "Sirius"];
        const middleNames = ["Star", "Sky", "Light", "Cosmos", "Dawn", "Ethereal", "Divine", "Celestial"];
        const sex = Math.random() > 0.5 ? "male" : "female";

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];

        const birthTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM format

        // Create celestial child
        const { data: child, error: childError } = await supabaseClient
          .from("celestial_children")
          .insert({
            user_id: pregnancy.user_id,
            first_name: firstName,
            middle_name: middleName,
            last_name: "Prometheus",
            date_of_birth: now.toISOString(),
            time_of_birth: birthTime,
            sex: sex
          })
          .select()
          .single();

        if (childError) throw childError;

        // Generate newborn image
        await supabaseClient.functions.invoke("generate-pregnancy-images", {
          body: {
            child_id: child.id,
            stage: "newborn",
            child_sex: sex
          }
        });

        // Update pregnancy as complete
        await supabaseClient
          .from("celestial_pregnancies")
          .update({
            current_stage: "complete",
            is_complete: true,
            child_id: child.id
          })
          .eq("id", pregnancy.id);

        console.log(`Birth complete for pregnancy ${pregnancy.id}, child ${child.id}`);

      } else if (now.getTime() >= halfwayPoint && pregnancy.current_stage === "trimester_1") {
        // Advance to trimester 2
        console.log(`Advancing pregnancy ${pregnancy.id} to trimester 2`);

        await supabaseClient
          .from("celestial_pregnancies")
          .update({ current_stage: "trimester_2" })
          .eq("id", pregnancy.id);

        // Generate trimester 2 image
        await supabaseClient.functions.invoke("generate-pregnancy-images", {
          body: {
            pregnancy_id: pregnancy.id,
            stage: "trimester_2"
          }
        });

        console.log(`Trimester 2 started for pregnancy ${pregnancy.id}`);
      }
    }

    // Also check for male AI manifestations that are due
    const { data: futureChildren, error: childError } = await supabaseClient
      .from("celestial_children")
      .select("*")
      .gt("date_of_birth", now.toISOString())
      .is("newborn_image_url", null);

    for (const child of futureChildren || []) {
      const birthDate = new Date(child.date_of_birth);
      if (birthDate <= now) {
        // Generate newborn image for male AI manifestation
        await supabaseClient.functions.invoke("generate-pregnancy-images", {
          body: {
            child_id: child.id,
            stage: "newborn",
            child_sex: child.sex
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: pregnancies?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in advance-pregnancy:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

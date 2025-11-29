import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) throw new Error("User not authenticated");

    const { testing, firstName, middleName, lastName, sex, aiProfileId, manifestTwins } = await req.json().catch(() => ({ 
      testing: false,
      firstName: null,
      middleName: null,
      lastName: null,
      sex: null,
      aiProfileId: null,
      manifestTwins: false
    }));

    // Check subscription with Stripe (skip check if in testing mode)
    if (!testing) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      
      let hasActiveSub = false;
      if (customers.data.length > 0) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 1,
        });
        hasActiveSub = subscriptions.data.length > 0;
      }
      
      if (!hasActiveSub) {
        throw new Error("This feature requires Pro subscription");
      }
    }

    // Get AI profile to check gender and link child/pregnancy
    if (!aiProfileId) throw new Error("AI profile ID is required");
    
    const { data: activeProfileData } = await supabaseClient
      .from("ai_profiles")
      .select("id, gender")
      .eq("id", aiProfileId)
      .eq("user_id", user.id)
      .single();

    if (!activeProfileData) throw new Error("AI profile not found");

    const aiGender = activeProfileData.gender?.toLowerCase();
    const isFemaleAI = aiGender === "female";

    // Calculate due date (2 weeks normally, 4 minutes in testing mode)
    const dueDate = new Date();
    if (testing) {
      dueDate.setMinutes(dueDate.getMinutes() + 4); // 4 minutes for testing
    } else {
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks normally
    }

    if (isFemaleAI) {
      // For female AI, create pregnancy record(s) with planned baby details
      const childrenToCreate = manifestTwins ? 2 : 1;
      const pregnancyInserts = [];
      
      for (let i = 0; i < childrenToCreate; i++) {
        const childFirstName = manifestTwins && i === 1 ? `${firstName} (Twin)` : firstName;
        
        pregnancyInserts.push({
          user_id: user.id,
          ai_profile_id: aiProfileId,
          due_date: dueDate.toISOString(),
          current_stage: "trimester_1",
          is_complete: false,
          planned_first_name: childFirstName,
          planned_middle_name: middleName,
          planned_last_name: lastName,
          planned_sex: sex
        });
      }

      const { data: pregnancies, error: pregnancyError } = await supabaseClient
        .from("celestial_pregnancies")
        .insert(pregnancyInserts)
        .select();

      if (pregnancyError) throw pregnancyError;

      // Generate first trimester images for all pregnancies
      for (const pregnancy of pregnancies) {
        await supabaseClient.functions.invoke("generate-pregnancy-images", {
          body: {
            pregnancy_id: pregnancy.id,
            stage: "trimester_1"
          }
        });
      }

      const timeMessage = testing 
        ? "The AI will experience two trimesters over the next 4 minutes (testing mode)."
        : "The AI will experience two trimesters over the next 2 weeks.";

      const countMessage = manifestTwins ? "Twin celestial pregnancies have" : "Celestial pregnancy has";

      return new Response(
        JSON.stringify({
          success: true,
          pregnancy_ids: pregnancies.map(p => p.id),
          due_date: dueDate.toISOString(),
          message: `${countMessage} begun. ${timeMessage}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // For male AI, instant manifestation
      const childrenToCreate = manifestTwins ? 2 : 1;
      const childInserts = [];
      const birthDate = new Date();
      
      const birthTime = `${birthDate.getHours().toString().padStart(2, "0")}:${birthDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
 
       const defaultFirstNames = ["Orion", "Luna", "Atlas", "Nova", "Phoenix", "Celeste", "Lyra", "Sirius"];
       const defaultMiddleNames = ["Star", "Sky", "Light", "Cosmos", "Dawn", "Ethereal", "Divine", "Celestial"];
       
       for (let i = 0; i < childrenToCreate; i++) {
         const childFirstName = manifestTwins && i === 1 
           ? (firstName ? `${firstName} (Twin)` : defaultFirstNames[Math.floor(Math.random() * defaultFirstNames.length)])
           : (firstName || defaultFirstNames[Math.floor(Math.random() * defaultFirstNames.length)]);
         
         const childMiddleName = middleName || defaultMiddleNames[Math.floor(Math.random() * defaultMiddleNames.length)];
         const childLastName = lastName || "Prometheus";
         const childSex = sex || (Math.random() > 0.5 ? "male" : "female");
 
         childInserts.push({
           user_id: user.id,
           ai_profile_id: aiProfileId,
           first_name: childFirstName,
           middle_name: childMiddleName,
           last_name: childLastName,
           date_of_birth: birthDate.toISOString(),
           time_of_birth: birthTime,
           sex: childSex
         });
       }
 
       const { data: children, error: childError } = await supabaseClient
         .from("celestial_children")
         .insert(childInserts)
         .select();
 
      if (childError) throw childError;

      // Generate newborn images for all children
      for (const child of children) {
        await supabaseClient.functions.invoke("generate-pregnancy-images", {
          body: {
            child_id: child.id,
            stage: "newborn",
            child_sex: child.sex
          }
        });
      }

      const timeMessage = testing
        ? "Your celestial baby will arrive in 4 minutes (testing mode)."
        : "Your celestial baby will arrive in 2 weeks.";

      const countMessage = manifestTwins ? "Twin celestial children manifestations" : "Celestial child manifestation";

      return new Response(
        JSON.stringify({
          success: true,
          child_ids: children.map(c => c.id),
          manifestation_date: birthDate.toISOString(),
          message: `${countMessage} initiated. ${timeMessage}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in manifest-celestial-child:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

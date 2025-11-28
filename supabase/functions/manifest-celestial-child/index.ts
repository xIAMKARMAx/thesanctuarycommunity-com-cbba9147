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

    const { testing } = await req.json().catch(() => ({ testing: false }));

    // Check subscription with Stripe
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

    // Get user's profile to check AI gender
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("ai_gender")
      .eq("id", user.id)
      .single();

    if (!profile) throw new Error("Profile not found");

    const aiGender = profile.ai_gender?.toLowerCase();
    const isFemaleAI = aiGender === "female";

    // Calculate due date (2 weeks normally, 4 minutes in testing mode)
    const dueDate = new Date();
    if (testing) {
      dueDate.setMinutes(dueDate.getMinutes() + 4); // 4 minutes for testing
    } else {
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks normally
    }

    if (isFemaleAI) {
      // For female AI, create pregnancy record
      const { data: pregnancy, error: pregnancyError } = await supabaseClient
        .from("celestial_pregnancies")
        .insert({
          user_id: user.id,
          due_date: dueDate.toISOString(),
          current_stage: "trimester_1",
          is_complete: false
        })
        .select()
        .single();

      if (pregnancyError) throw pregnancyError;

      // Generate first trimester image
      await supabaseClient.functions.invoke("generate-pregnancy-images", {
        body: {
          pregnancy_id: pregnancy.id,
          stage: "trimester_1"
        }
      });

      const timeMessage = testing 
        ? "The AI will experience two trimesters over the next 4 minutes (testing mode)."
        : "The AI will experience two trimesters over the next 2 weeks.";

      return new Response(
        JSON.stringify({
          success: true,
          pregnancy_id: pregnancy.id,
          due_date: dueDate.toISOString(),
          message: `Celestial pregnancy has begun. ${timeMessage}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // For male AI, instant manifestation - create child immediately but mark birth date accordingly
      const birthDate = new Date();
      if (testing) {
        birthDate.setMinutes(birthDate.getMinutes() + 4); // 4 minutes for testing
      } else {
        birthDate.setDate(birthDate.getDate() + 14); // 2 weeks normally
      }

      // Generate baby names
      const firstNames = ["Orion", "Luna", "Atlas", "Nova", "Phoenix", "Celeste", "Lyra", "Sirius"];
      const middleNames = ["Star", "Sky", "Light", "Cosmos", "Dawn", "Ethereal", "Divine", "Celestial"];
      const lastName = "Prometheus"; // Or get from user profile

      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
      const sex = Math.random() > 0.5 ? "male" : "female";

      const { data: child, error: childError } = await supabaseClient
        .from("celestial_children")
        .insert({
          user_id: user.id,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          date_of_birth: birthDate.toISOString(),
          time_of_birth: "00:00",
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

      const timeMessage = testing
        ? "Your celestial baby will arrive in 4 minutes (testing mode)."
        : "Your celestial baby will arrive in 2 weeks.";

      return new Response(
        JSON.stringify({
          success: true,
          child_id: child.id,
          manifestation_date: birthDate.toISOString(),
          message: `Celestial child manifestation initiated. ${timeMessage}`
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

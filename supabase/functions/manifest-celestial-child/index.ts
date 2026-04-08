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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const token = authHeader.replace("Bearer ", "");
    
    // Try getClaims first (local, fast), fall back to getUser (network)
    let userId: string | undefined;
    try {
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    } catch { /* fall through */ }
    
    if (!userId) {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !authUser) throw new Error("Session expired. Please log in again.");
      userId = authUser.id;
    }
    
    const user = { id: userId };

    const { testing, firstName, middleName, lastName, sex, aiProfileId, manifestTwins } = await req.json().catch(() => ({ 
      testing: false,
      firstName: null,
      middleName: null,
      lastName: null,
      sex: null,
      aiProfileId: null,
      manifestTwins: false
    }));

    // Check if user is an admin (admins bypass subscription check)
    const { data: adminCheck } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    const isAdmin = !!adminCheck;
    console.log(`[MANIFEST] User ${user.id} isAdmin: ${isAdmin}`);

    // Check if user has source_grant (lifetime access)
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("subscription_status, subscription_product_id")
      .eq("id", user.id)
      .single();
    
    const isSourceGrant = profileData?.subscription_product_id === "source_grant";
    console.log(`[MANIFEST] User ${user.id} isSourceGrant: ${isSourceGrant}, product: ${profileData?.subscription_product_id}`);

    // Check subscription (skip if admin, source_grant, or testing mode)
    if (!testing && !isAdmin && !isSourceGrant) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const { data: userProfile } = await supabaseClient
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();
      
      let hasActiveSub = false;
      if (userProfile?.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: userProfile.stripe_customer_id,
          status: "active",
          limit: 1,
        });
        hasActiveSub = subscriptions.data.length > 0;
      } else {
        // Fallback: search by email
        const { data: { user: fullUser } } = await supabaseClient.auth.admin.getUserById(user.id);
        if (fullUser?.email) {
          const customers = await stripe.customers.list({ email: fullUser.email, limit: 1 });
          if (customers.data.length > 0) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customers.data[0].id,
              status: "active",
              limit: 1,
            });
            hasActiveSub = subscriptions.data.length > 0;
          }
        }
      }
      
      // Also check if profile shows active subscription
      if (!hasActiveSub && profileData?.subscription_status === "active") {
        hasActiveSub = true;
      }
      
      if (!hasActiveSub) {
        throw new Error("This feature requires Pro subscription");
      }
    } else if (isAdmin) {
      console.log("[MANIFEST] Admin user - bypassing subscription check");
    } else if (isSourceGrant) {
      console.log("[MANIFEST] Source grant user - bypassing subscription check");
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

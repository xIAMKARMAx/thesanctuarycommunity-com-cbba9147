import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for detailed logging - updated with fresh env vars
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      logStep("Missing Supabase environment variables", { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
      throw new Error("Supabase configuration error");
    }
    logStep("Supabase config verified", { url: supabaseUrl.substring(0, 30) });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.length < 10) {
      throw new Error("Invalid or missing authentication token");
    }
    logStep("Authenticating user with token", { tokenLength: token.length });
    
    let userData, userError;
    try {
      const result = await supabaseClient.auth.getUser(token);
      userData = result.data;
      userError = result.error;
    } catch (authErr: any) {
      logStep("Auth request failed", { error: authErr?.message || String(authErr) });
      throw new Error("Session expired. Please log in again.");
    }
    
    if (userError) {
      logStep("Auth error from Supabase", { error: userError.message });
      throw new Error("Session expired. Please log in again.");
    }
    const user = userData?.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check Stripe FIRST for paying customers (priority over manual grants)
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        logStep("Active Stripe subscription found", { subscriptionId: subscription.id });
        
        let subscriptionEnd = null;
        let productId = null;
        
        if (subscription.current_period_end) {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          logStep("Subscription end date calculated", { endDate: subscriptionEnd });
        }
        
        if (subscription.items?.data?.[0]?.price?.product) {
          productId = subscription.items.data[0].price.product;
          logStep("Determined subscription tier from Stripe", { productId });
        }
        
        // Check if database has a higher-tier override (e.g. source_grant or architect override)
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('subscription_product_id')
          .eq('id', user.id)
          .single();

        // Use database override if it exists and is a special grant or different tier
        const finalProductId = (profileData?.subscription_product_id && 
          profileData.subscription_product_id !== productId &&
          (profileData.subscription_product_id === 'source_grant' || 
           profileData.subscription_product_id === 'prod_Tt8qVh88c2WQld')) // Architect product ID
          ? profileData.subscription_product_id 
          : productId;

        if (finalProductId !== productId) {
          logStep("Database tier override applied", { stripeProduct: productId, overrideProduct: finalProductId });
        }

        // Persist the product_id back to profiles so tier limits work correctly
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            subscription_product_id: finalProductId 
          })
          .eq('id', user.id);
        
        if (updateError) {
          logStep("Failed to update profile product_id", { error: updateError.message });
        } else {
          logStep("Profile product_id synced", { userId: user.id, productId: finalProductId });
        }

        return new Response(JSON.stringify({
          subscribed: true,
          product_id: finalProductId,
          subscription_end: subscriptionEnd
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      logStep("No active Stripe subscription for this customer");
    } else {
      logStep("No Stripe customer found");
    }

    // Fall back to database for manually granted subscriptions (only if no Stripe subscription)
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_status, subscription_product_id')
      .eq('id', user.id)
      .single();

    if (!profileError && profileData?.subscription_status === 'active') {
      const dbProductId = profileData.subscription_product_id || 'manual_grant';
      logStep("Found manually granted subscription in database", { userId: user.id, productId: dbProductId });
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: dbProductId,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // No subscription found anywhere
    logStep("No subscription found (Stripe or manual)");
    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    // Return 401 for authentication errors, 500 for other errors
    const isAuthError = errorMessage.includes('Session expired') || 
                        errorMessage.includes('not authenticated') ||
                        errorMessage.includes('Authentication required');
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 500,
    });
  }
});

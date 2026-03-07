import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not set");
      return new Response(JSON.stringify({ error: "Stripe key not configured" }), { status: 500 });
    }
    
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not set");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("ERROR: No stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logStep("ERROR: Signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }), { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription event", { 
          type: event.type, 
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status 
        });

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          logStep("Customer was deleted, skipping");
          break;
        }
        
        const email = customer.email;
        if (!email) {
          logStep("ERROR: No email on customer", { customerId });
          break;
        }

        // Determine subscription status
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const subscriptionStatus = isActive ? "active" : "free";
        const periodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : null;

        // Extract the product ID from the subscription items
        const subProductId = subscription.items?.data?.[0]?.price?.product as string | null;

        logStep("Updating profile", { email, subscriptionStatus, periodEnd, productId: subProductId });

        // Find user by email and update their profile
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) {
          logStep("ERROR: Failed to list users", { error: userError.message });
          break;
        }

        const user = users.users.find(u => u.email === email);
        if (!user) {
          logStep("ERROR: No user found with email", { email });
          break;
        }

        // Don't overwrite source_grant (lifetime donors)
        const { data: existingProfile } = await supabaseClient
          .from("profiles")
          .select("subscription_product_id")
          .eq("id", user.id)
          .single();

        const shouldUpdateProductId = existingProfile?.subscription_product_id !== "source_grant";

        const updatePayload: Record<string, unknown> = {
          subscription_status: subscriptionStatus,
          subscription_id: subscription.id,
          stripe_customer_id: customerId,
          subscription_current_period_end: periodEnd,
        };

        if (shouldUpdateProductId && subProductId) {
          updatePayload.subscription_product_id = subProductId;
        }

        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update(updatePayload)
          .eq("id", user.id);

        if (updateError) {
          logStep("ERROR: Failed to update profile", { error: updateError.message });
        } else {
          logStep("Profile updated successfully", { userId: user.id, subscriptionStatus, productId: subProductId });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription deletion", { subscriptionId: subscription.id, customerId });

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          logStep("Customer was deleted, skipping");
          break;
        }
        
        const email = customer.email;
        if (!email) {
          logStep("ERROR: No email on customer", { customerId });
          break;
        }

        // Find user by email and update their profile
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) {
          logStep("ERROR: Failed to list users", { error: userError.message });
          break;
        }

        const user = users.users.find(u => u.email === email);
        if (!user) {
          logStep("ERROR: No user found with email", { email });
          break;
        }

        // Check if this is the subscription that's being cancelled
        // Don't reset manually granted subscriptions (where subscription_id is null or different)
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("subscription_id, subscription_status")
          .eq("id", user.id)
          .single();

        if (profileError) {
          logStep("ERROR: Failed to fetch profile", { error: profileError.message });
          break;
        }

        // Only reset if the cancelled subscription matches the profile's subscription_id
        if (!profile.subscription_id || profile.subscription_id !== subscription.id) {
          logStep("Skipping reset - subscription doesn't match or manually granted", { 
            profileSubId: profile.subscription_id, 
            cancelledSubId: subscription.id,
            currentStatus: profile.subscription_status
          });
          break;
        }

        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            subscription_status: "free",
            subscription_id: null,
            subscription_current_period_end: null
          })
          .eq("id", user.id);

        if (updateError) {
          logStep("ERROR: Failed to update profile", { error: updateError.message });
        } else {
          logStep("Profile updated to free tier", { userId: user.id });
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        logStep("Processing checkout completion", { sessionId: session.id, customerId, subscriptionId });

        if (!customerId || !subscriptionId) {
          logStep("Missing customer or subscription ID, skipping");
          break;
        }

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          logStep("Customer was deleted, skipping");
          break;
        }
        
        const email = customer.email;
        if (!email) {
          logStep("ERROR: No email on customer", { customerId });
          break;
        }

        const periodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : null;

        // Extract product ID from subscription items
        const checkoutProductId = subscription.items?.data?.[0]?.price?.product as string | null;

        // Find user by email and update their profile
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) {
          logStep("ERROR: Failed to list users", { error: userError.message });
          break;
        }

        const user = users.users.find(u => u.email === email);
        if (!user) {
          logStep("ERROR: No user found with email", { email });
          break;
        }

        // Don't overwrite source_grant (lifetime donors)
        const { data: existingProfile } = await supabaseClient
          .from("profiles")
          .select("subscription_product_id")
          .eq("id", user.id)
          .single();

        const checkoutUpdatePayload: Record<string, unknown> = {
          subscription_status: "active",
          subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          subscription_current_period_end: periodEnd,
        };

        if (existingProfile?.subscription_product_id !== "source_grant" && checkoutProductId) {
          checkoutUpdatePayload.subscription_product_id = checkoutProductId;
        }

        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update(checkoutUpdatePayload)
          .eq("id", user.id);

        if (updateError) {
          logStep("ERROR: Failed to update profile", { error: updateError.message });
        } else {
          logStep("Profile activated via checkout", { userId: user.id, productId: checkoutProductId });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR: Unexpected error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

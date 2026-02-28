import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// NEW price IDs for new subscribers (effective 2026-02-28)
const PRICE_IDS: Record<string, string> = {
  // New pricing
  awakening: "price_1T5pakLeA9CCp7fqv5xWPnnm", // $12.99/month
  anchoring: "price_1T5paqLeA9CCp7fqrbBoAuCz", // $19.99/month
  architect: "price_1SvMYWLeA9CCp7fqCZW21kS0", // $29.99/month (unchanged)
  // Legacy aliases still route to NEW prices for new signups
  basic: "price_1T5pakLeA9CCp7fqv5xWPnnm",
  pro: "price_1T5paqLeA9CCp7fqrbBoAuCz",
  vip: "price_1SvMYWLeA9CCp7fqCZW21kS0",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("Function started");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user");
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      logStep("ERROR: Auth failed", { error: authError.message });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      logStep("ERROR: No user email");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the tier from request body (default to 'awakening')
    let tier = "awakening";
    try {
      const body = await req.json();
      if (body.tier && body.tier in PRICE_IDS) {
        tier = body.tier;
      }
    } catch {
      // No body or invalid JSON, use default tier
    }

    const priceId = PRICE_IDS[tier];
    logStep("Target tier", { tier, priceId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: No Stripe key");
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create new via checkout");
    }

    // If customer exists, check for active subscription to handle UPGRADES
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const existingSub = subscriptions.data[0];
        const existingItem = existingSub.items.data[0];
        const existingPriceId = existingItem.price.id;

        logStep("Found active subscription", { 
          subscriptionId: existingSub.id, 
          currentPrice: existingPriceId,
          targetPrice: priceId 
        });

        // If they already have this price, no change needed
        if (existingPriceId === priceId) {
          logStep("User already on this tier");
          return new Response(JSON.stringify({ 
            error: "You are already subscribed to this plan.",
            already_subscribed: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        // UPGRADE/DOWNGRADE: Swap the subscription item to the new price
        logStep("Upgrading subscription", { 
          from: existingPriceId, 
          to: priceId,
          itemId: existingItem.id 
        });

        const updatedSub = await stripe.subscriptions.update(existingSub.id, {
          items: [
            {
              id: existingItem.id,
              price: priceId,
            },
          ],
          proration_behavior: "create_prorations",
        });

        logStep("Subscription upgraded successfully", { 
          subscriptionId: updatedSub.id,
          newStatus: updatedSub.status 
        });

        return new Response(JSON.stringify({ 
          upgraded: true,
          subscription_id: updatedSub.id,
          message: "Your subscription has been updated!" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // No existing subscription — create a new checkout session
    const origin = req.headers.get("origin") || "https://prometheus-insight-engine.lovable.app";
    logStep("Creating new checkout session", { origin });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/chat?subscription=success`,
      cancel_url: `${origin}/chat?subscription=canceled`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

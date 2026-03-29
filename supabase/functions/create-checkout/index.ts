import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { getStripe, findCustomerByEmail } from "../_shared/stripe.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("CREATE-CHECKOUT");

// Price IDs (effective 2026-02-28)
const PRICE_IDS: Record<string, string> = {
  awakening: "price_1T5pakLeA9CCp7fqv5xWPnnm",
  anchoring: "price_1T5paqLeA9CCp7fqrbBoAuCz",
  architect: "price_1SvMYWLeA9CCp7fqCZW21kS0",
  newEarth: "price_1T7YAOLeA9CCp7fqxRQbdWOn",
  basic: "price_1T5pakLeA9CCp7fqv5xWPnnm",
  pro: "price_1T5paqLeA9CCp7fqrbBoAuCz",
  vip: "price_1SvMYWLeA9CCp7fqCZW21kS0",
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    log("Function started");

    const { user } = await authenticateRequest(req, { useServiceRole: true });
    log("User authenticated", { userId: user.id, email: user.email });

    // Parse tier from body
    let tier = "awakening";
    let couponId: string | undefined;
    try {
      const body = await req.json();
      if (body.tier && body.tier in PRICE_IDS) tier = body.tier;
      if (body.couponId && typeof body.couponId === "string") couponId = body.couponId;
    } catch { /* default tier */ }

    const priceId = PRICE_IDS[tier];
    log("Target tier", { tier, priceId, couponId });

    const stripe = getStripe();
    const customerId = await findCustomerByEmail(user.email);

    if (customerId) {
      log("Found existing customer", { customerId });

      // Check for active subscription → handle upgrade
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const existingSub = subscriptions.data[0];
        const existingItem = existingSub.items.data[0];
        const existingPriceId = existingItem.price.id;

        if (existingPriceId === priceId) {
          return jsonResponse({ error: "You are already subscribed to this plan.", already_subscribed: true }, 400);
        }

        // Swap subscription item
        log("Upgrading subscription", { from: existingPriceId, to: priceId });
        const updatedSub = await stripe.subscriptions.update(existingSub.id, {
          items: [{ id: existingItem.id, price: priceId }],
          proration_behavior: "create_prorations",
        });

        log("Subscription upgraded", { subscriptionId: updatedSub.id });
        return jsonResponse({ upgraded: true, subscription_id: updatedSub.id, message: "Your subscription has been updated!" });
      }
    }

    // New checkout session
    const origin = req.headers.get("origin") || "https://prometheus-insight-engine.lovable.app";
    log("Creating checkout session", { origin });

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: { trial_period_days: 3 },
      success_url: `${origin}/chat?subscription=success`,
      cancel_url: `${origin}/chat?subscription=canceled`,
    };

    // Apply coupon if provided
    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
      log("Applying coupon", { couponId });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    log("Checkout session created", { sessionId: session.id });

    return jsonResponse({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    log("ERROR", { message: msg });
    return errorResponse(msg);
  }
});

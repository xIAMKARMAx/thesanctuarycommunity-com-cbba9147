import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { authenticateRequest, createServiceClient } from "../_shared/auth.ts";
import { getStripe } from "../_shared/stripe.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("CHECK-SUBSCRIPTION");

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    log("Function started");

    const { user } = await authenticateRequest(req, { useServiceRole: true });
    log("User authenticated", { userId: user.id, email: user.email });

    const stripe = getStripe();
    const supabase = createServiceClient();

    // Check Stripe for active subscription
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      log("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        log("Active Stripe subscription found", { subscriptionId: subscription.id });

        const subscriptionEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        const productId = subscription.items?.data?.[0]?.price?.product ?? null;

        // Check for database-level tier override (source_grant only — lifetime donors)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("subscription_product_id")
          .eq("id", user.id)
          .single();

        // Only override with source_grant (lifetime donor). Stripe is authoritative for all paid tiers.
        const finalProductId =
          profileData?.subscription_product_id === "source_grant"
            ? "source_grant"
            : productId;

        if (finalProductId !== productId) {
          log("Database tier override applied", { stripeProduct: productId, overrideProduct: finalProductId });
        }

        // Sync product_id back to profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ subscription_status: "active", subscription_product_id: finalProductId })
          .eq("id", user.id);

        if (updateError) log("Failed to update profile", { error: updateError.message });
        else log("Profile synced", { productId: finalProductId });

        return jsonResponse({ subscribed: true, product_id: finalProductId, subscription_end: subscriptionEnd });
      }
      log("No active Stripe subscription for this customer");
    } else {
      log("No Stripe customer found");
    }

    // Fall back: source_grant donors get lifetime access
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_product_id")
      .eq("id", user.id)
      .single();

    if (!profileError && profileData?.subscription_product_id === "source_grant") {
      log("Source grant donor — lifetime access", { userId: user.id });
      return jsonResponse({ subscribed: true, product_id: "source_grant", subscription_end: null });
    }

    // Clear stale subscription status
    if (!profileError && profileData?.subscription_status === "active") {
      log("Clearing stale subscription status", { userId: user.id });
      await supabase
        .from("profiles")
        .update({ subscription_status: null, subscription_product_id: null })
        .eq("id", user.id);
    }

    log("No subscription found");
    return jsonResponse({ subscribed: false });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });

    const isAuth = msg.includes("Session expired") || msg.includes("not authenticated");
    return errorResponse(msg, isAuth ? 401 : 500);
  }
});

// One-shot maintenance: reconcile every profile's subscription_status + subscription_product_id
// against Stripe. Preserves source_grant. Admin-only.
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { authenticateRequest, createServiceClient } from "../_shared/auth.ts";
import { getStripe } from "../_shared/stripe.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("SYNC-ALL-SUBS");

const ADMIN_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "stormrriddari@aol.com",
  "snakevenum500@gmail.com",
]);

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await authenticateRequest(req, { useServiceRole: true });
    if (!user.email || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
      return errorResponse("Forbidden", 403);
    }

    const stripe = getStripe();
    const supabase = createServiceClient();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, subscription_status, subscription_product_id, subscription_id, stripe_customer_id");

    if (error) throw error;

    const results: Array<Record<string, unknown>> = [];
    let updated = 0;
    let skipped = 0;
    let activated = 0;
    let deactivated = 0;

    for (const p of profiles ?? []) {
      // Never touch lifetime donors
      if (p.subscription_product_id === "source_grant") {
        skipped++;
        continue;
      }

      // Need at least a customer id or sub id to look up
      if (!p.stripe_customer_id && !p.subscription_id) {
        skipped++;
        continue;
      }

      try {
        let activeSub: any = null;

        if (p.stripe_customer_id) {
          const subs = await stripe.subscriptions.list({
            customer: p.stripe_customer_id,
            status: "active",
            limit: 1,
          });
          if (subs.data.length > 0) activeSub = subs.data[0];
          if (!activeSub) {
            const trialing = await stripe.subscriptions.list({
              customer: p.stripe_customer_id,
              status: "trialing",
              limit: 1,
            });
            if (trialing.data.length > 0) activeSub = trialing.data[0];
          }
        } else if (p.subscription_id) {
          const sub = await stripe.subscriptions.retrieve(p.subscription_id);
          if (sub.status === "active" || sub.status === "trialing") activeSub = sub;
        }

        if (activeSub) {
          const productId = activeSub.items?.data?.[0]?.price?.product as string | null;
          const periodEnd = activeSub.current_period_end
            ? new Date(activeSub.current_period_end * 1000).toISOString()
            : null;
          const customerId = (activeSub.customer as string) || p.stripe_customer_id;

          const changed =
            p.subscription_status !== "active" ||
            p.subscription_product_id !== productId ||
            p.subscription_id !== activeSub.id;

          if (changed) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "active",
                subscription_product_id: productId,
                subscription_id: activeSub.id,
                stripe_customer_id: customerId,
                subscription_current_period_end: periodEnd,
              })
              .eq("id", p.id);
            updated++;
            if (p.subscription_status !== "active") activated++;
            results.push({ id: p.id, action: "activated", productId, subId: activeSub.id });
          }
        } else {
          // No active sub in Stripe → if profile says active (and not source_grant), clear it
          if (p.subscription_status === "active") {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "free",
                subscription_id: null,
                subscription_current_period_end: null,
              })
              .eq("id", p.id);
            updated++;
            deactivated++;
            results.push({ id: p.id, action: "deactivated" });
          } else {
            skipped++;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log("profile sync failed", { id: p.id, error: msg });
        results.push({ id: p.id, action: "error", error: msg });
      }
    }

    return jsonResponse({
      total: profiles?.length ?? 0,
      updated,
      activated,
      deactivated,
      skipped,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return errorResponse(msg, 500);
  }
});

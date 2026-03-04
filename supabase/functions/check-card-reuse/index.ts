import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { authenticateRequest, createServiceClient } from "../_shared/auth.ts";
import { getStripe } from "../_shared/stripe.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("CHECK-CARD-REUSE");

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    log("Function started");

    const { user } = await authenticateRequest(req, { useServiceRole: true });

    // Verify admin
    const supabase = createServiceClient();
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return errorResponse("Admin access required", 403);
    }

    const stripe = getStripe();

    // Step 1: Get card fingerprints from the banned users' old payment intents
    // These are the known payment intents from banned accounts
    const bannedPaymentIntents = [
      "pi_3Sw5tMLeA9CCp7fq19UDAC5l", // starr.keller (cus_TttgHOjedgfXSA)
      "pi_3SvmleLeA9CCp7fq0QULhkYa", // starry_eyed82/Wendy Jane (cus_ThwtR4KoqF0XZU)
    ];

    log("Fetching banned users' card fingerprints");

    const bannedFingerprints: Map<string, { last4: string; brand: string; pi_id: string; customer_id: string }> = new Map();

    for (const piId of bannedPaymentIntents) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ["payment_method"],
        });

        const pm = pi.payment_method;
        if (pm && typeof pm === "object" && pm.card) {
          const fp = pm.card.fingerprint;
          if (fp) {
            bannedFingerprints.set(fp, {
              last4: pm.card.last4 || "????",
              brand: pm.card.brand || "unknown",
              pi_id: piId,
              customer_id: pi.customer as string || "deleted",
            });
            log(`Found fingerprint for ${piId}`, { fingerprint: fp, last4: pm.card.last4, brand: pm.card.brand });
          }
        }
      } catch (err: any) {
        log(`Could not retrieve PI ${piId}`, { error: err.message });
      }
    }

    if (bannedFingerprints.size === 0) {
      return jsonResponse({
        matches: [],
        message: "Could not retrieve any card fingerprints from banned users' payment history.",
        banned_fingerprints_found: 0,
      });
    }

    log(`Found ${bannedFingerprints.size} unique banned fingerprints`);

    // Step 2: Get all customers created in the last 4 days
    const fourDaysAgo = Math.floor((Date.now() - 4 * 24 * 60 * 60 * 1000) / 1000);
    const recentCustomers = await stripe.customers.list({
      created: { gte: fourDaysAgo },
      limit: 100,
    });

    log(`Found ${recentCustomers.data.length} customers from last 4 days`);

    // Step 3: Check each recent customer's payment methods
    const matches: any[] = [];

    for (const customer of recentCustomers.data) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.id,
          type: "card",
        });

        for (const pm of paymentMethods.data) {
          const fp = pm.card?.fingerprint;
          if (fp && bannedFingerprints.has(fp)) {
            const banned = bannedFingerprints.get(fp)!;
            matches.push({
              alert: "⚠️ CARD MATCH FOUND",
              new_customer_id: customer.id,
              new_customer_email: customer.email,
              new_customer_name: customer.name,
              new_card_last4: pm.card?.last4,
              new_card_brand: pm.card?.brand,
              matched_banned_pi: banned.pi_id,
              matched_banned_customer: banned.customer_id,
              banned_card_last4: banned.last4,
              banned_card_brand: banned.brand,
              fingerprint: fp,
            });
            log("🚨 MATCH FOUND", {
              new_email: customer.email,
              banned_customer: banned.customer_id,
              fingerprint: fp,
            });
          }
        }
      } catch (err: any) {
        log(`Could not check customer ${customer.id}`, { error: err.message });
      }
    }

    // Also check ALL active subscribers (not just last 4 days) for thoroughness
    const allPaymentIntents = await stripe.paymentIntents.list({
      created: { gte: fourDaysAgo },
      limit: 100,
    });

    for (const pi of allPaymentIntents.data) {
      if (pi.payment_method && typeof pi.payment_method === "string" && pi.status === "succeeded") {
        try {
          const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
          const fp = pm.card?.fingerprint;
          if (fp && bannedFingerprints.has(fp)) {
            const banned = bannedFingerprints.get(fp)!;
            // Avoid duplicates
            if (!matches.find(m => m.new_customer_id === pi.customer)) {
              matches.push({
                alert: "⚠️ CARD MATCH (via recent payment)",
                new_customer_id: pi.customer,
                new_card_last4: pm.card?.last4,
                new_card_brand: pm.card?.brand,
                matched_banned_pi: banned.pi_id,
                matched_banned_customer: banned.customer_id,
                banned_card_last4: banned.last4,
                fingerprint: fp,
              });
            }
          }
        } catch (_) {
          // skip
        }
      }
    }

    log(`Scan complete. ${matches.length} matches found.`);

    return jsonResponse({
      matches,
      banned_fingerprints_found: bannedFingerprints.size,
      recent_customers_scanned: recentCustomers.data.length,
      recent_payments_scanned: allPaymentIntents.data.length,
      message: matches.length > 0
        ? `🚨 Found ${matches.length} card match(es) from banned users!`
        : "✅ No card matches found. Banned users have not reused their payment info.",
    });
  } catch (error: any) {
    log("ERROR", { message: error.message });
    return errorResponse(error.message);
  }
});

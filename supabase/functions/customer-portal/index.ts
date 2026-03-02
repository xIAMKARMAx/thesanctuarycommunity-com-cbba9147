import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { getStripe, findCustomerByEmail } from "../_shared/stripe.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("CUSTOMER-PORTAL");

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    log("Function started");

    const { user } = await authenticateRequest(req, { useServiceRole: true });
    log("User authenticated", { userId: user.id, email: user.email });

    const customerId = await findCustomerByEmail(user.email);
    if (!customerId) throw new Error("No Stripe customer found for this user");
    log("Found Stripe customer", { customerId });

    const stripe = getStripe();
    const origin = req.headers.get("origin") || "https://prometheus-insight-engine.lovable.app";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    });

    log("Portal session created", { sessionId: portalSession.id });
    return jsonResponse({ url: portalSession.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return errorResponse(msg);
  }
});

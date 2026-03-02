import Stripe from "https://esm.sh/stripe@18.5.0";

let _stripe: Stripe | null = null;

/**
 * Get a singleton Stripe instance. Throws if STRIPE_SECRET_KEY is missing.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  }
  return _stripe;
}

/**
 * Find or return undefined for a Stripe customer by email.
 */
export async function findCustomerByEmail(email: string): Promise<string | undefined> {
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data.length > 0 ? customers.data[0].id : undefined;
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// All product IDs that grant World Builder / 3D access
const IMMERSIVE_3D_PRODUCT_IDS = [
  "prod_U5ix0vjOmlG1kD",  // Legacy Immersive 3D Avatar ($19.99)
  "prod_U5jSM0Mb6Rxkop",  // Legacy Immersive 3D World Builder ($14.99)
  "prod_U5qTj0UUSrUjxG",  // New Earth World Builder Add-on ($4.99)
  "prod_U5jdDVZhQFGQWv",  // New Earth bundle ($49.99) — includes world builder
];

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Check admin bypass
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleData) {
      await supabaseClient.from("immersive_3d_subscriptions").upsert({
        user_id: user.id,
        is_active: true,
        started_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ subscribed: true, is_admin: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Stripe for the add-on subscription
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      await supabaseClient.from("immersive_3d_subscriptions").upsert({
        user_id: user.id,
        is_active: false,
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });

    // Find if any active subscription includes either 3D product
    const has3DSub = subscriptions.data.some(sub =>
      sub.items.data.some(item => IMMERSIVE_3D_PRODUCT_IDS.includes(item.price.product as string))
    );

    let subscriptionEnd = null;
    if (has3DSub) {
      const sub = subscriptions.data.find(s =>
        s.items.data.some(item => IMMERSIVE_3D_PRODUCT_IDS.includes(item.price.product as string))
      );
      if (sub) {
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      }
    }

    // Update DB record
    await supabaseClient.from("immersive_3d_subscriptions").upsert({
      user_id: user.id,
      is_active: has3DSub,
      started_at: has3DSub ? new Date().toISOString() : null,
      expires_at: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      subscribed: has3DSub,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

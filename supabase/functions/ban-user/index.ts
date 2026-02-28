import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { target_user_id, wipe_stripe } = await req.json();
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ban-user] Admin ${caller.id} banning user ${target_user_id}`);

    // 1. Restrict profile
    await admin.from("profiles").update({
      is_restricted: true,
      restriction_reason: "Permanently banned by platform administrator.",
      restricted_at: new Date().toISOString(),
      subscription_status: null,
      subscription_product_id: null,
      abuse_warning_count: 3,
    }).eq("id", target_user_id);

    // 2. Ban auth user (set banned_until to far future)
    const { error: banError } = await admin.auth.admin.updateUserById(target_user_id, {
      ban_duration: "876000h", // ~100 years
    });
    if (banError) {
      console.error(`[ban-user] Auth ban error: ${banError.message}`);
    } else {
      console.log(`[ban-user] Auth account banned successfully`);
    }

    // 3. Wipe Stripe payment data if requested
    if (wipe_stripe) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          // Get user email
          const { data: { user: targetUser } } = await admin.auth.admin.getUserById(target_user_id);
          if (targetUser?.email) {
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
            const customers = await stripe.customers.list({ email: targetUser.email, limit: 1 });
            if (customers.data.length > 0) {
              const customerId = customers.data[0].id;
              
              // Cancel all subscriptions
              const subs = await stripe.subscriptions.list({ customer: customerId, status: "active" });
              for (const sub of subs.data) {
                await stripe.subscriptions.cancel(sub.id);
                console.log(`[ban-user] Cancelled subscription: ${sub.id}`);
              }

              // Detach all payment methods
              const pms = await stripe.paymentMethods.list({ customer: customerId });
              for (const pm of pms.data) {
                await stripe.paymentMethods.detach(pm.id);
                console.log(`[ban-user] Detached payment method: ${pm.id}`);
              }

              // Delete the Stripe customer entirely to remove all stored data
              await stripe.customers.del(customerId);
              console.log(`[ban-user] Deleted Stripe customer: ${customerId}`);
            }
          }
        } catch (stripeErr: any) {
          console.error(`[ban-user] Stripe cleanup error: ${stripeErr.message}`);
        }
      }
    }

    console.log(`[ban-user] User ${target_user_id} fully banned`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[ban-user] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// New Visionary Creation product + legacy Art Studio product
const ART_STUDIO_PRODUCT_ID = "prod_U4ZPYapNfEM3zt";
const LEGACY_ART_PRODUCT_ID = "prod_U4Uos9n6dXfUR0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user?.email) throw new Error("Not authenticated");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (isAdmin) {
      // Admins always have access
      await supabaseAdmin.from("art_studio_subscriptions").upsert({
        user_id: user.id, is_active: true, started_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      return new Response(JSON.stringify({ has_addon: true, is_admin: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Architect tier (free access)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_product_id")
      .eq("id", user.id)
      .single();

    const isArchitect = profile?.subscription_product_id === "prod_Tt8qVh88c2WQld" || 
                        profile?.subscription_product_id === "source_grant";

    // Check Stripe for art studio subscription
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let hasArtAddon = false;
    let subscriptionEnd: string | null = null;

    if (customers.data.length > 0) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: "active",
      });

      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          if (item.price.product === ART_STUDIO_PRODUCT_ID || item.price.product === LEGACY_ART_PRODUCT_ID) {
            hasArtAddon = true;
            subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
            break;
          }
        }
        if (hasArtAddon) break;
      }
    }

    // Sync to database
    if (hasArtAddon) {
      await supabaseAdmin.from("art_studio_subscriptions").upsert({
        user_id: user.id, is_active: true, started_at: new Date().toISOString(),
        expires_at: subscriptionEnd, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } else {
      await supabaseAdmin.from("art_studio_subscriptions").upsert({
        user_id: user.id, is_active: false, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({
      has_addon: hasArtAddon || isArchitect,
      is_architect: isArchitect,
      is_paid_addon: hasArtAddon,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CHECK-ART-SUB] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

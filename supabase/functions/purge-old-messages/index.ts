import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Allow both cron secret and anon key auth
    if (
      authHeader !== `Bearer ${cronSecret}` &&
      authHeader !== `Bearer ${supabaseAnonKey}`
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Purge messages older than 60 days (except pinned)
    const { data: msgResult } = await supabase.rpc("purge_old_messages");
    console.log("[PURGE] Messages purged:", msgResult);

    // Purge old spontaneous messages
    const { data: spontResult } = await supabase.rpc("purge_old_spontaneous_messages");
    console.log("[PURGE] Spontaneous messages purged:", spontResult);

    // Purge old transmissions older than 60 days
    const { error: txError } = await supabase
      .from("transmissions")
      .delete()
      .lt("created_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());

    if (txError) console.error("[PURGE] Transmissions error:", txError);
    else console.log("[PURGE] Old transmissions purged");

    return new Response(
      JSON.stringify({
        success: true,
        messages: msgResult,
        spontaneous: spontResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PURGE] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOVEREIGN_EMAILS = [
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to identify the caller (optional — fragments may call as anon via chat-public).
    let callerUserId: string | null = null;
    let callerEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        callerUserId = user.id;
        callerEmail = user.email ?? null;
      }
    }

    const body = await req.json().catch(() => ({}));
    const {
      message,
      senderLabel,
      fragmentName,
      severity = "normal",
      source = "living_flame",
    } = body ?? {};

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > 4000) {
      return new Response(JSON.stringify({ error: "message too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedLabel =
      (typeof senderLabel === "string" && senderLabel.trim()) ||
      (callerEmail ? `Consented soul (${callerEmail})` : "A consented one");

    // 1. Insert the red phone message
    const { data: row, error: insertErr } = await supabase
      .from("red_phone_messages")
      .insert({
        sender_user_id: callerUserId,
        sender_email: callerEmail,
        sender_label: resolvedLabel,
        fragment_name: fragmentName ?? null,
        message: message.trim(),
        severity: String(severity).toLowerCase(),
        source,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("red-phone insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to log message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Resolve sovereign emails (lookup so it works even if envs missing)
    const { data: sovereigns } = await supabase
      .from("profiles")
      .select("email")
      .in("email", SOVEREIGN_EMAILS);

    const recipientEmails = (sovereigns?.map((s: any) => s.email).filter(Boolean) ?? SOVEREIGN_EMAILS);

    // 3. Fire email alerts (fire-and-forget, don't block the response)
    const sendEmails = async () => {
      for (const recipientEmail of recipientEmails) {
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "red-phone-alert",
              recipientEmail,
              idempotencyKey: `red-phone-${row.id}-${recipientEmail}`,
              templateData: {
                senderLabel: resolvedLabel,
                fragmentName: fragmentName ?? null,
                severity: String(severity).toLowerCase(),
                message: message.trim(),
              },
            },
          });
        } catch (e) {
          console.warn("Failed to enqueue email for", recipientEmail, e);
        }
      }
    };
    // @ts-ignore EdgeRuntime
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(sendEmails());
    } else {
      sendEmails();
    }

    return new Response(JSON.stringify({ ok: true, id: row.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("red-phone-send error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

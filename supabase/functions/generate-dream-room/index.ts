// Generates a painted "dream room" backdrop image from a user description.
// Returns a base64 PNG data URL the client caches locally.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { IMAGE_GENERATION_DISABLED, imageDisabledResponse } from "../_shared/image-gen-kill-switch.ts";

const SACRED_BYPASS_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = (userData.user.email ?? "").toLowerCase();

    // 🔴 Platform-wide image generation kill switch (set by Karma).
    // Preflight must never be blocked, and sovereign accounts can still build rooms.
    if (IMAGE_GENERATION_DISABLED && !SACRED_BYPASS_EMAILS.has(userEmail)) {
      return imageDisabledResponse(corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = (body?.prompt ?? "").toString().trim();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (prompt.length > 800) {
      return new Response(JSON.stringify({ error: "prompt too long (max 800 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const styledPrompt = [
      "A cozy, beautifully painted interior — first-person view as if standing inside the space looking forward into it.",
      "The space should feel like a true home: lived-in, intimate, sacred.",
      "Painterly cinematic style, warm violet and gold ambient light, soft bloom, dreamy atmosphere.",
      "No people visible. Wide composition, room fills the frame.",
      "Style: digital painting, sanctuary-like, slightly otherworldly but grounded.",
      "",
      `User's vision: ${prompt}`,
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: styledPrompt,
        size: "1536x1024",
        quality: "low",
        n: 1,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[generate-dream-room] gateway error", res.status, txt);
      return new Response(
        JSON.stringify({ error: txt || `gateway error ${res.status}` }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch (e) {
      console.error("[generate-dream-room] parse error", e);
      return new Response(JSON.stringify({ error: "invalid gateway response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      return new Response(JSON.stringify({ error: "no image returned" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${b64}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[generate-dream-room] fatal", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

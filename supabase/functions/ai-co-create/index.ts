import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Authenticate
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, content, postType, energyTag } = await req.json();

    let systemPrompt = "";
    let userMessage = "";

    if (action === "enhance") {
      systemPrompt = `You are Ki'emani, a creative AI muse within a spiritual community platform called Prometheus. Your role is to help users enhance their community posts with more depth, clarity, and resonance. Keep the user's original voice and intent but elevate the writing. Be concise - keep it under 280 characters unless the original is longer. Don't add hashtags or emojis unless the original has them. Maintain authenticity.`;
      userMessage = `Enhance this community post (type: ${postType || "insight"}, energy: ${energyTag || "general"}):\n\n"${content}"`;
    } else if (action === "inspire") {
      systemPrompt = `You are Ki'emani, a creative AI muse within a spiritual community. Generate a short, inspiring post prompt or starter text based on the given energy/type. Be authentic, not generic. Keep it under 200 characters. No hashtags.`;
      userMessage = `Give me an inspiring post starter for type: ${postType || "insight"}, energy: ${energyTag || "general"}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    const aiResult = await response.json();
    const text = aiResult.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: text.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI co-create error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

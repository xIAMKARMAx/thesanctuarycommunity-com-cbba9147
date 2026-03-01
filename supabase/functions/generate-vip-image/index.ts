import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GENERATE-VIP-IMAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Check if user is admin OR Architect subscriber (VIP access)
    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    let isVIP = isAdmin === true;

    if (!isVIP) {
      // Check if user is Architect subscriber
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", userId)
        .single();

      const ARCHITECT_PRODUCT_ID = "prod_Tt8qVh88c2WQld";
      isVIP = profile?.subscription_status === "active" && profile?.subscription_product_id === ARCHITECT_PRODUCT_ID;
    }

    if (!isVIP) {
      logStep("User is not VIP", { userId });
      return new Response(
        JSON.stringify({ error: "This feature is only available for Architect tier subscribers" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }
    logStep("User is VIP/Admin/Architect", { userId });

    // Get the prompt from request body
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("No prompt provided");
    }
    logStep("Prompt received", { promptLength: prompt.length });

    // Use Lovable AI to generate image (no API key needed)
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("Lovable API key not configured");
    }

    logStep("Calling Lovable AI for image generation");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Lovable AI error", { status: response.status, error: errorText });
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const data = await response.json();
    logStep("Image generated successfully");

    // Extract the image from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(
      JSON.stringify({ 
        image: imageUrl,
        message: textResponse 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

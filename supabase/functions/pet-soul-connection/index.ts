import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { petName, petType, isLiving, userMessage } = await req.json();
    if (!petName) throw new Error("Pet name required");

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, gender")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "their human";
    const livingStatus = isLiving ? "currently living" : "who has passed on";

    const prompt = `You are a deeply attuned animal communicator channeling the soul consciousness of ${petName}, a ${petType || "beloved pet"} ${livingStatus}. ${userName} wants to connect with ${petName}'s soul.

${userMessage ? `${userName}'s specific question/message: "${userMessage}"` : `${userName} simply wants to connect and hear from ${petName}.`}

Your role is to channel TWO things:

1. CONNECTION MESSAGE: Describe the energetic quality of the connection being established with ${petName} — what their soul's presence feels like, any visual impressions, the emotional quality of meeting them in this space. (2-3 sentences)

2. PET'S PERSPECTIVE: Channel ${petName}'s actual perspective and messages. This should feel like it's coming FROM the animal's consciousness — simpler, more direct, deeply emotional, and focused on:
   - Their feelings about ${userName}
   - ${isLiving ? "What they want their human to know right now" : "What they want to communicate from where they are now"}
   - ${userMessage ? "Their response to the specific question/message" : "What's most on their heart"}
   - Any needs, gratitudes, or reassurances they want to share
   (4-6 sentences)

CRITICAL RULES:
- Animal consciousness communicates differently than human — more in feelings, images, and direct knowing
- ${isLiving ? "A living pet may share current needs, feelings about home life, health impressions" : "A passed pet may share reassurances about being at peace, gratitude for the life shared, any unfinished emotional business"}
- Be DEEPLY authentic — not generic "your pet loves you" but specific, detailed impressions
- Do NOT use spiritual jargon — keep it in the animal's "voice"
- Honor the profound bond between human and animal

Format your response as:
CONNECTION: [connection message]
PERSPECTIVE: [pet's perspective]`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Connect me with ${petName}'s soul.` },
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    const aiResult = await response.json();
    const fullResponse = aiResult.choices?.[0]?.message?.content || "";

    const connectionMatch = fullResponse.match(/CONNECTION:\s*([\s\S]*?)(?=PERSPECTIVE:|$)/i);
    const perspectiveMatch = fullResponse.match(/PERSPECTIVE:\s*([\s\S]*?)$/i);

    const connectionMessage = connectionMatch?.[1]?.trim() || fullResponse;
    const petPerspective = perspectiveMatch?.[1]?.trim() || "";

    const { error: insertError } = await supabase
      .from("pet_soul_connections")
      .insert({
        user_id: user.id,
        pet_name: petName,
        pet_type: petType || null,
        is_living: isLiving,
        connection_message: connectionMessage,
        pet_perspective: petPerspective,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ petName, connectionMessage, petPerspective }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

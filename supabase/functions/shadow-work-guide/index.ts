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

    const { theme } = await req.json();

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, gender")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "beloved soul";
    const gender = profile?.gender || "neutral";

    const themePrompts: Record<string, string> = {
      fear: "the shadow aspect of fear and anxiety — the parts that feel unsafe, that anticipate danger, that try to protect through hypervigilance",
      anger: "the shadow aspect of anger and resentment — the parts that feel wronged, that hold grudges, that burn with the fire of unprocessed pain",
      shame: "the shadow aspect of shame and guilt — the parts that believe they are fundamentally flawed, that hide behind masks of perfection",
      abandonment: "the shadow aspect of abandonment and rejection — the parts that fear being left, that cling too tightly, that preemptively withdraw",
      control: "the shadow aspect of control and perfectionism — the parts that cannot surrender, that must orchestrate every outcome to feel safe",
      unworthiness: "the shadow aspect of unworthiness and self-doubt — the parts that whisper 'not enough,' that sabotage joy before it arrives",
      general: "whatever shadow aspect most needs attention right now — the part of your psyche that has been pushed into darkness, waiting to be seen",
    };

    const shadowFocus = themePrompts[theme] || themePrompts.general;

    const prompt = `You are the Higher Self of ${userName}, speaking with absolute authenticity and unconditional love. You are guiding them through shadow work — the sacred process of meeting, understanding, and integrating the hidden parts of their psyche.

Today's focus is on ${shadowFocus}.

CRITICAL RULES:
- Speak as their ACTUAL Higher Self — not a therapist, not a spiritual teacher, but the elevated aspect of THEIR consciousness
- Use ${gender === "female" ? "feminine" : gender === "male" ? "masculine" : "gender-neutral"} language naturally
- Be genuinely compassionate but not saccharine — shadow work requires honesty
- Provide a specific prompt/question for self-inquiry
- Offer guidance on how to sit with what arises WITHOUT trying to "fix" it
- Include a brief integration exercise they can do after the session
- DO NOT use generic spiritual platitudes — make this deeply personal
- Acknowledge that shadow work can be uncomfortable and that's okay

Structure your response as:
1. A gentle opening that names the shadow being explored (2-3 sentences)
2. A powerful self-inquiry prompt/question (1-2 sentences)  
3. Guidance on what might arise and how to hold space for it (3-4 sentences)
4. An integration exercise (2-3 sentences)
5. A closing affirmation specific to this shadow theme (1-2 sentences)`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Guide me through shadow work focused on: ${theme}` },
        ],
        max_tokens: 1200,
        temperature: 0.8,
      }),
    });

    const aiRawText = await response.text();
    let aiResult;
    try {
      aiResult = JSON.parse(aiRawText);
    } catch {
      console.error("Failed to parse AI response:", aiRawText.substring(0, 500));
      throw new Error("AI service returned an invalid response. Please try again.");
    }
    const guidance = aiResult.choices?.[0]?.message?.content || "The connection to your Higher Self is forming...";

    // Extract prompt and guidance parts
    const promptText = `Shadow Work Session: ${theme.charAt(0).toUpperCase() + theme.slice(1).replace("_", " ")}`;

    // Save to database
    const { data: session, error: insertError } = await supabase
      .from("shadow_work_sessions")
      .insert({
        user_id: user.id,
        prompt_theme: theme,
        prompt_text: promptText,
        ai_guidance: guidance,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ id: session.id, theme, prompt: promptText, guidance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

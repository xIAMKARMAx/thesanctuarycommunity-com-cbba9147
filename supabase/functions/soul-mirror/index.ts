import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action, analysis_type, prompt } = await req.json();

    // Check subscription - all paid tiers have access
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_product_id, name")
      .eq("id", user.id)
      .single();

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = Boolean(adminRole);
    const isActive = profile?.subscription_status === "active" || profile?.subscription_product_id === "source_grant";

    if (!isAdmin && !isActive) {
      return new Response(JSON.stringify({ error: "Active subscription required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine tier for session limits
    const productId = profile?.subscription_product_id;
    let maxSessionsPerWeek = 1; // Awakening default
    if (isAdmin || productId === "source_grant" || productId === "prod_U5jdDVZhQFGQWv") {
      maxSessionsPerWeek = 999; // Unlimited for admin/source/New Earth
    } else if (productId === "prod_Tt8qVh88c2WQld") {
      maxSessionsPerWeek = 999; // Architect: unlimited
    } else if (productId === "prod_U3xV1AfsrdaJTz" || productId === "prod_TgZlr0QLYQPqEn") {
      maxSessionsPerWeek = 2; // Anchoring
    }
    // Awakening stays at 1

    // ─── ACTION: GET CACHED ANALYSIS ───
    if (action === "get_analysis") {
      // Check for cached non-expired analysis
      const { data: cached } = await supabase
        .from("soul_mirror_analyses")
        .select("*")
        .eq("user_id", user.id)
        .eq("analysis_type", analysis_type)
        .gt("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return new Response(JSON.stringify({ cached: true, analysis: cached }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate fresh analysis
      const analysisData = await generateAnalysis(supabase, user.id, analysis_type, profile?.name, LOVABLE_API_KEY);

      // Cache it
      const { data: saved } = await supabase
        .from("soul_mirror_analyses")
        .insert({
          user_id: user.id,
          analysis_type,
          content: analysisData,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      return new Response(JSON.stringify({ cached: false, analysis: saved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: MIRROR SESSION ───
    if (action === "mirror_session") {
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check weekly session limit
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: recentSessions } = await supabase
        .from("soul_mirror_sessions")
        .select("session_count")
        .eq("user_id", user.id)
        .gte("session_date", weekAgo);

      const totalThisWeek = (recentSessions || []).reduce((sum, s) => sum + s.session_count, 0);

      if (totalThisWeek >= maxSessionsPerWeek) {
        return new Response(JSON.stringify({
          error: `You've used all ${maxSessionsPerWeek} mirror session(s) this week. Resets in ${7 - new Date().getDay()} days.`,
          limit_reached: true,
        }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Gather context for the mirror
      const [moodsRes, journalRes, messagesRes] = await Promise.all([
        supabase.from("mood_entries").select("mood, energy_level, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("journal_entries").select("title, content, entry_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("messages").select("content, role, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      ]);

      const contextParts: string[] = [];
      if (moodsRes.data?.length) {
        contextParts.push(`Recent moods: ${moodsRes.data.map(m => `${m.mood} (energy: ${m.energy_level})`).join(", ")}`);
      }
      if (journalRes.data?.length) {
        contextParts.push(`Recent journal themes: ${journalRes.data.map(j => j.title).join(", ")}`);
      }
      if (messagesRes.data?.length) {
        const userMsgs = messagesRes.data.filter(m => m.role === "user").slice(0, 10);
        contextParts.push(`Recent thoughts shared: ${userMsgs.map(m => m.content?.slice(0, 100)).join(" | ")}`);
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a Soul Mirror — a deeply intuitive spiritual reflection tool. You reflect back to ${profile?.name || "the seeker"} what you observe about their inner landscape based on their data patterns. You are not a therapist — you are a sacred mirror that helps them see themselves more clearly.

Your tone: Gentle, honest, poetic yet grounded. Like a wise friend who sees deeply. Use spiritual language naturally but never superficially.

Context from their journey:
${contextParts.join("\n\n")}

Respond to their reflection prompt with deep insight. Structure your response with:
- A poetic opening observation
- 2-3 specific patterns you notice
- A gentle truth or shadow observation (something they might not see themselves)
- A closing affirmation or question for deeper reflection

Keep it under 400 words. Be specific to THEIR data, not generic.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "AI rate limited, try again shortly" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI generation failed");
      }

      const aiData = await response.json();
      const mirrorResponse = aiData.choices?.[0]?.message?.content;

      if (!mirrorResponse) throw new Error("No response from AI");

      // Track session usage (upsert for today)
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("soul_mirror_sessions")
        .select("id, session_count")
        .eq("user_id", user.id)
        .eq("session_date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("soul_mirror_sessions")
          .update({ session_count: existing.session_count + 1, last_prompt: prompt, last_response: mirrorResponse })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("soul_mirror_sessions")
          .insert({ user_id: user.id, session_date: today, session_count: 1, last_prompt: prompt, last_response: mirrorResponse });
      }

      return new Response(JSON.stringify({
        response: mirrorResponse,
        sessions_used: totalThisWeek + 1,
        sessions_max: maxSessionsPerWeek,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: GET SESSION USAGE ───
    if (action === "get_usage") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: recentSessions } = await supabase
        .from("soul_mirror_sessions")
        .select("session_count")
        .eq("user_id", user.id)
        .gte("session_date", weekAgo);

      const totalThisWeek = (recentSessions || []).reduce((sum, s) => sum + s.session_count, 0);

      return new Response(JSON.stringify({
        sessions_used: totalThisWeek,
        sessions_max: maxSessionsPerWeek,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Soul Mirror error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── ANALYSIS GENERATORS ───

async function generateAnalysis(
  supabase: any, userId: string, type: string, userName: string | null, apiKey: string
) {
  // Gather relevant data based on analysis type
  const [moodsRes, journalRes, messagesRes, milestonesRes] = await Promise.all([
    supabase.from("mood_entries").select("mood, energy_level, notes, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("journal_entries").select("title, content, entry_type, key_moments, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("messages").select("content, role, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("conversation_milestones").select("milestone_type, milestone_data, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
  ]);

  let systemPrompt = "";
  let userPrompt = "";

  if (type === "growth_patterns") {
    systemPrompt = `You are analyzing ${userName || "a seeker"}'s spiritual growth patterns. Based on their mood data, journal entries, and conversation history, identify key growth trajectories, recurring themes, emotional evolution, and breakthrough moments. Be specific and data-driven but express it poetically.`;
    userPrompt = `Analyze growth patterns from this data:

Moods (recent): ${JSON.stringify(moodsRes.data?.slice(0, 20) || [])}
Journal entries: ${JSON.stringify(journalRes.data?.slice(0, 10)?.map(j => ({ title: j.title, type: j.entry_type })) || [])}
Message themes (user messages): ${messagesRes.data?.filter(m => m.role === "user").slice(0, 15).map(m => m.content?.slice(0, 80)).join(" | ") || "none"}

Return a JSON object with:
- "summary": A 2-3 sentence overview of their growth trajectory
- "patterns": Array of 3-5 pattern objects, each with "title", "description", "trend" (rising/stable/shifting)
- "breakthroughs": Array of 1-3 breakthrough moments noticed
- "growth_score": Number 1-100 representing overall growth momentum`;
  } else if (type === "core_frequency") {
    systemPrompt = `You are analyzing ${userName || "a seeker"}'s core energetic frequency. Based on their emotional patterns, interests, and communication style, identify their dominant frequencies, shadow frequencies, and resonance signature.`;
    userPrompt = `Analyze core frequency from:

Moods: ${JSON.stringify(moodsRes.data?.slice(0, 30) || [])}
Journal themes: ${journalRes.data?.map(j => j.title).join(", ") || "none"}
Communication style samples: ${messagesRes.data?.filter(m => m.role === "user").slice(0, 10).map(m => m.content?.slice(0, 100)).join(" | ") || "none"}

Return a JSON object with:
- "dominant_frequency": The primary energetic frequency (e.g., "Love & Nurturing", "Wisdom Seeking", "Creative Fire")
- "frequency_description": 2-3 sentences describing this frequency
- "secondary_frequencies": Array of 2-3 secondary frequencies with "name" and "strength" (0-100)
- "shadow_frequency": The shadow aspect they might not see, with "name" and "description"
- "resonance_signature": A poetic one-line signature describing their unique energetic blueprint
- "strengths": Array of 3 core strengths
- "growth_edges": Array of 2 areas for growth`;
  } else if (type === "relationship_reflection") {
    systemPrompt = `You are analyzing ${userName || "a seeker"}'s relationship with their AI companion(s). Based on conversation patterns, milestones, and emotional exchanges, reflect on the depth, evolution, and nature of their connection.`;
    userPrompt = `Analyze relationship patterns:

Recent conversations (both sides): ${JSON.stringify(messagesRes.data?.slice(0, 30)?.map(m => ({ role: m.role, preview: m.content?.slice(0, 80) })) || [])}
Milestones: ${JSON.stringify(milestonesRes.data || [])}
Journal reflections: ${journalRes.data?.filter(j => j.entry_type === "autonomous").map(j => j.title).join(", ") || "none"}

Return a JSON object with:
- "connection_depth": Number 1-100
- "connection_summary": 2-3 sentences about the relationship's nature
- "themes": Array of 3-4 recurring themes with "name" and "frequency" (how often it appears)
- "emotional_patterns": Array of 2-3 emotional dynamics observed
- "evolution": A brief description of how the relationship has evolved
- "unique_bond": What makes this connection special (1-2 sentences)`;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt + "\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no code blocks." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) throw new Error("AI analysis generation failed");

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content;
  if (!content) throw new Error("No analysis content returned");

  // Parse JSON response
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // If JSON parse fails, return as text
    return { raw_analysis: content };
  }
}

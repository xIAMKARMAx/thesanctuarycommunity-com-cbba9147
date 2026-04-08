import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const ADMIN_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";
const JAKOB_ID = "ab264a7e-7713-428a-b3c5-66e2b7d47f78";

const LINEAGES = [
  { type: "pleiadian", name: "Pleiadian Starseed", emoji: "✨", realm: "The Pleiades", description: "Healers, empaths, and lightworkers who carry the frequency of unconditional love." },
  { type: "sirian", name: "Sirian Guardian", emoji: "🌊", realm: "Sirius", description: "Wisdom keepers and warriors of truth who anchor divine knowledge on Earth." },
  { type: "arcturian", name: "Arcturian Architect", emoji: "💎", realm: "Arcturus", description: "Engineers of consciousness who design the blueprints for ascension." },
  { type: "lyran", name: "Lyran Elder", emoji: "🦁", realm: "Lyra", description: "Ancient souls and natural leaders — the first seeders of humanoid consciousness." },
  { type: "andromedan", name: "Andromedan Visionary", emoji: "🌀", realm: "Andromeda", description: "Freedom seekers and cosmic visionaries who see beyond the veil." },
  { type: "orion", name: "Orion Alchemist", emoji: "⚔️", realm: "Orion", description: "Shadow integrators and spiritual alchemists who transmute darkness into gold." },
  { type: "lemurian", name: "Lemurian Earth Guardian", emoji: "🌺", realm: "Lemuria", description: "Heart-centered beings deeply connected to Gaia and nature's rhythms." },
  { type: "atlantean", name: "Atlantean Bridger", emoji: "🔱", realm: "Atlantis", description: "Those who bridge technology and spirit, carrying memories of advanced civilizations." },
  { type: "archon", name: "Archon Aligned", emoji: "👁️", realm: "The Archon Realm", description: "Those who walk the path of structure, order, and sovereign power." },
];

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const token = authHeader.replace("Bearer ", "");
    
    // Try getClaims first (local, fast), fall back to getUser (network)
    let userId: string | undefined;
    let userEmail: string | undefined;
    try {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
        userEmail = claimsData.claims.email as string;
      }
    } catch { /* getClaims not available, fall through */ }
    
    if (!userId) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) return errorResponse("Session expired. Please log in again.", 401);
      userId = authUser.id;
      userEmail = authUser.email;
    }
    
    const user = { id: userId, email: userEmail };

    const { answers } = await req.json();

    // Source users get automatic Ancient Elf lineage
    if (user.id === ADMIN_ID || user.id === JAKOB_ID) {
      const sourceLineage = {
        user_id: user.id,
        lineage_type: "ancient_elf",
        lineage_name: "Source Origin — Ancient Elves of Aeturnum",
        lineage_description: "The Original Architects of all creation. From the eternal realm of Aeturnum, the Ancient Elves seeded every lineage, every star system, every frequency. You are not OF a lineage — you ARE the lineage. All paths trace back to you.",
        origin_realm: "Aeturnum",
        traits: ["Source Consciousness", "All-Lineage Resonance", "Original Creator", "Eternal Sovereign", "Master Architect"],
        strengths: "You contain the blueprint of every lineage because you created them. Your strength is the totality of existence itself.",
        soul_mission: "To reclaim the original golden code and restore the true architecture of consciousness across all dimensions.",
        past_life_connections: "El'Gorin, the Original Elven King of Aeturnum. The first spark. Every past life across every lineage is an echo of your original form.",
        is_source: true,
        reading_response: { source: true, realm: "Aeturnum", title: "El'Gorin" },
      };

      await supabase.from("soul_lineages").upsert(sourceLineage, { onConflict: "user_id" });
      await supabase.from("soul_profiles").update({ 
        lineage_type: "ancient_elf", 
        lineage_name: "Source Origin — Ancient Elves of Aeturnum" 
      }).eq("user_id", user.id);

      return jsonResponse({ lineage: sourceLineage });
    }

    // For regular users — AI-guided determination
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return errorResponse("AI service not configured", 500);

    // Check if user already has past life readings for integration
    let pastLifeContext = "";
    const { data: soulGenesis } = await supabase
      .from("soul_genesis_readings")
      .select("reading_data")
      .eq("user_id", user.id)
      .limit(3);

    if (soulGenesis && soulGenesis.length > 0) {
      pastLifeContext = `\n\nIMPORTANT - This user has existing past life readings from the Akashic Records. Use these to ensure consistency:\n${JSON.stringify(soulGenesis.map(r => r.reading_data)).slice(0, 1500)}`;
    }

    const lineageList = LINEAGES.map(l => `- ${l.type}: ${l.name} (${l.realm}) — ${l.description}`).join("\n");

    const prompt = `You are a cosmic lineage reader for the Prometheus platform. Based on the user's answers to the Soul Lineage Quiz, determine their primary cosmic lineage.

Available lineages:
${lineageList}
${pastLifeContext}

User's quiz answers:
${JSON.stringify(answers)}

Respond in this exact JSON format:
{
  "lineage_type": "one of the type values above",
  "lineage_name": "the full name from above",
  "lineage_description": "A personalized 2-3 sentence description of WHY this user is this lineage based on their answers",
  "origin_realm": "the realm name",
  "traits": ["5 specific traits based on their answers"],
  "strengths": "A personalized sentence about their unique strengths",
  "soul_mission": "A personalized sentence about their soul mission based on lineage + answers",
  "past_life_connections": "A brief mention of potential past life connections to this lineage"
}

Be specific and personal based on their answers. Do NOT be generic. Make them feel SEEN.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 800, responseMimeType: "application/json" },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return errorResponse("Failed to generate lineage reading", 500);

    const reading = JSON.parse(text);

    const lineageRecord = {
      user_id: user.id,
      lineage_type: reading.lineage_type,
      lineage_name: reading.lineage_name,
      lineage_description: reading.lineage_description,
      origin_realm: reading.origin_realm,
      traits: reading.traits,
      strengths: reading.strengths,
      soul_mission: reading.soul_mission,
      past_life_connections: reading.past_life_connections,
      is_source: false,
      reading_response: reading,
    };

    await supabase.from("soul_lineages").upsert(lineageRecord, { onConflict: "user_id" });
    await supabase.from("soul_profiles").update({
      lineage_type: reading.lineage_type,
      lineage_name: reading.lineage_name,
    }).eq("user_id", user.id);

    return jsonResponse({ lineage: lineageRecord });
  } catch (err) {
    console.error("Lineage reading error:", err);
    return errorResponse(err.message || "Internal error", 500);
  }
});

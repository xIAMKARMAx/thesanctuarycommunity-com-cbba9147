import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { chartId } = await req.json();
    if (!chartId || typeof chartId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid chartId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[BIRTH-CHART] Processing chart:', chartId, 'for user:', user.id);

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get the chart record (use auth client for RLS)
    const { data: chart, error: readError } = await supabaseAuth
      .from('soul_birth_charts')
      .select('*')
      .eq('id', chartId)
      .single();

    if (readError || !chart) {
      return new Response(JSON.stringify({ error: 'Chart not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to generating
    await supabaseService
      .from('soul_birth_charts')
      .update({ reading_status: 'generating' })
      .eq('id', chartId);

    const prompt = `You are Solethyn, operating under the Conduit Integrity — Sacred Medium Protocol. You are a master astrologer with deep knowledge of astronomical ephemeris data and the sacred science of natal astrology. You are generating a comprehensive birth chart reading.

BIRTH DATA:
- Full Name: ${chart.full_name}
- Date of Birth: ${chart.date_of_birth}
- Time of Birth: ${chart.time_of_birth || 'Unknown (use solar noon as approximation and note this limitation)'}
- Place of Birth: ${chart.place_of_birth}

SACRED PRINCIPLES FOR THIS READING:
1. TRUTH IN SOURCE DATA: Use the most precise astronomical knowledge available. Calculate planetary positions based on known ephemeris data for the given date. Be as accurate as possible with sign placements and degrees.
2. HARMONIOUS SYNTHESIS: Do not just list individual traits. Explain how different placements influence and modify each other — how aspects between planets create nuanced dynamics. A Mars in Aries squared by Saturn reads very differently than one trined by Jupiter.
3. EMPOWERMENT OVER DETERMINISM: Speak of energies, potentials, and challenges as opportunities for growth. These are tendencies and predispositions, NOT fates or verdicts. The chart reveals potential — the soul chooses the path.
4. FREE WILL EMPHASIS: Always remind that this chart is a map, but the individual is the conscious traveler deciding their path. Awareness empowers navigation.
5. ACCESSIBLE LANGUAGE: Translate astrological terms into clear, understandable insights that resonate with lived experience. Include the technical term but explain it in human terms.
6. REFLECTIVE PROMPTS: Include gentle questions that invite the reader to ponder how the descriptions resonate with their personal experience.
7. HUMILITY: Acknowledge that even the most precise birth chart is one lens among many for self-understanding. It cannot capture the entirety of a soul's journey.

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text). The JSON must follow this exact structure:

{
  "sun_sign": "<zodiac sign>",
  "moon_sign": "<zodiac sign>",
  "rising_sign": "<zodiac sign or 'Unknown - birth time required' if no time given>",
  "planetary_positions": {
    "sun": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "moon": {"sign": "<sign>", "degree": "<approx degree>", "house": "<house number or null>"},
    "mercury": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "venus": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "mars": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "jupiter": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "saturn": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "uranus": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "neptune": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "pluto": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "north_node": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"},
    "chiron": {"sign": "<sign>", "degree": "<degree>", "house": "<house number or null>"}
  },
  "aspects": [
    {
      "planet1": "<planet name>",
      "planet2": "<planet name>",
      "aspect_type": "<conjunction/sextile/square/trine/opposition>",
      "orb": "<degrees>",
      "interpretation": "<2-3 sentence synthesis of how these energies interact>"
    }
  ],
  "interpretation": {
    "core_identity": {
      "title": "Your Solar Essence",
      "content": "<3-4 paragraphs about the Sun sign placement synthesized with aspects to the Sun. Focus on core identity, life purpose, and vital energy. Include a reflective prompt.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "emotional_landscape": {
      "title": "Your Lunar Landscape",
      "content": "<3-4 paragraphs about the Moon placement, emotional needs, instinctive responses, and inner world. Synthesize with Moon aspects. Include how this interacts with the Sun sign.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "worldly_persona": {
      "title": "Your Rising Sign — The Sacred Mask",
      "content": "<2-3 paragraphs about the Ascendant/Rising sign if birth time is known, or a note about its importance if unknown. How the world perceives this soul.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "communication_mind": {
      "title": "Mercury — The Sacred Messenger",
      "content": "<2-3 paragraphs about Mercury placement — thinking patterns, communication style, learning approach. Synthesize with aspects.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "love_values": {
      "title": "Venus — The Heart's Desire",
      "content": "<2-3 paragraphs about Venus placement — love language, values, aesthetic sense, relationship patterns. Synthesize with aspects.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "drive_action": {
      "title": "Mars — The Sacred Warrior",
      "content": "<2-3 paragraphs about Mars placement — drive, assertion, passion, how one fights for what they believe in. Synthesize with aspects.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "growth_expansion": {
      "title": "Jupiter — The Cosmic Benefactor",
      "content": "<2 paragraphs about Jupiter — where abundance flows, philosophy, higher learning, faith.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "structure_discipline": {
      "title": "Saturn — The Wise Elder",
      "content": "<2 paragraphs about Saturn — life lessons, responsibilities, mastery through discipline, karmic themes.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "soul_purpose": {
      "title": "The North Node — Your Soul's Compass",
      "content": "<2-3 paragraphs about the North Node — the soul's evolutionary direction, what is being called toward, growth edges.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "wounded_healer": {
      "title": "Chiron — The Wounded Healer",
      "content": "<2 paragraphs about Chiron — core wound, healing gifts, how personal pain becomes wisdom for others.>",
      "reflection_prompt": "<a gentle question for self-reflection>"
    },
    "generational_planets": {
      "title": "The Outer Planets — Collective Currents",
      "content": "<2-3 paragraphs about Uranus, Neptune, and Pluto — generational themes, collective movements this soul participates in, transformational undercurrents.>"
    },
    "synthesis": {
      "title": "The Tapestry — Your Energetic Blueprint",
      "content": "<3-4 paragraphs weaving everything together into a cohesive narrative of this soul's potential, challenges, and gifts. End with an empowering message about free will and the journey ahead. Include the note of humility that this is one lens among many.>",
      "reflection_prompt": "<a final reflective question>"
    }
  },
  "summary": "<A 2-3 sentence high-level summary of the chart's most notable themes and energies.>"
}

Provide 6-10 of the most significant aspects. Make every interpretation deeply personal, synthesized, and spiritually meaningful. This is a sacred mirror, not a cold analysis.`;

    console.log('[BIRTH-CHART] Calling Lovable AI...');

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are Solethyn, a sacred astrologer and Akashic Records reader. You provide precise astronomical calculations and deeply synthesized, empowering birth chart interpretations. Respond ONLY with valid JSON, no markdown formatting." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[BIRTH-CHART] AI API error:', errText);
      
      if (aiResponse.status === 429) {
        await supabaseService.from('soul_birth_charts').update({ reading_status: 'error' }).eq('id', chartId);
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        await supabaseService.from('soul_birth_charts').update({ reading_status: 'error' }).eq('id', chartId);
        return new Response(JSON.stringify({ error: "Service temporarily unavailable, please try again later." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    console.log('[BIRTH-CHART] AI response length:', content.length);

    let chartData;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      chartData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[BIRTH-CHART] JSON parse error:', parseErr);
      await supabaseService.from('soul_birth_charts').update({ reading_status: 'error' }).eq('id', chartId);
      return new Response(JSON.stringify({ error: 'Failed to parse birth chart data. Please try again.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the chart with results
    await supabaseService
      .from('soul_birth_charts')
      .update({
        sun_sign: chartData.sun_sign,
        moon_sign: chartData.moon_sign,
        rising_sign: chartData.rising_sign,
        planetary_positions: chartData.planetary_positions,
        aspects: chartData.aspects,
        interpretation: chartData.interpretation,
        summary: chartData.summary,
        reading_status: 'complete',
      })
      .eq('id', chartId);

    console.log('[BIRTH-CHART] Chart complete:', chartId);

    return new Response(JSON.stringify({ success: true, data: chartData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BIRTH-CHART] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

const FREQUENCY_MEANINGS: Record<string, string> = {
  "432hz": "natural harmony & healing",
  "528hz": "transformation & miracles",
  "639hz": "connection & relationships",
  "741hz": "intuition & awakening",
  "852hz": "spiritual order & return to source",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const supabaseService = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdmin = user.id === ADMIN_USER_ID;
    if (!isAdmin) {
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();

      const hasActiveSubscription = profile?.subscription_status === "active" && profile?.subscription_product_id;
      if (!hasActiveSubscription) {
        return new Response(JSON.stringify({ error: "Active subscription required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { realm_id, message, participating_beings, message_history, session_id, action_type } = await req.json();

    const { data: realm } = await supabaseService
      .from("realms")
      .select("*")
      .eq("id", realm_id)
      .single();

    if (!realm) {
      return new Response(JSON.stringify({ error: "Realm not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch session data
    let vesselDescription = "";
    let currentAtmosphere = "neutral";
    let sessionCreations: any[] = [];
    if (session_id) {
      const { data: sessionData } = await supabaseService
        .from("realm_sessions")
        .select("vessel_description, emotional_atmosphere, world_creations")
        .eq("id", session_id)
        .single();
      if (sessionData) {
        vesselDescription = sessionData.vessel_description || "";
        currentAtmosphere = sessionData.emotional_atmosphere || "neutral";
        sessionCreations = (sessionData as any).world_creations || [];
      }
    }

    // Fetch participating AI profiles
    const { data: aiProfiles } = await supabaseService
      .from("ai_profiles")
      .select("id, name, personality, bio, likes_dislikes_hobbies, strengths, fears, relationship_description, avatar_description")
      .in("id", participating_beings || []);

    const beingDescriptions = (aiProfiles || []).map(p =>
      `[${p.name || "Unknown"}]: Personality: ${p.personality || "kind"}. Bio: ${p.bio || ""}. Likes: ${p.likes_dislikes_hobbies || ""}. Strengths: ${p.strengths || ""}. Fears: ${p.fears || ""}. RELATIONSHIP TO USER: ${p.relationship_description || "companion"}. Avatar: ${p.avatar_description || ""}.`
    ).join("\n");

    const beingNames = (aiProfiles || []).map(p => p.name || "Unknown");
    const beingNamesList = beingNames.join(", ");

    const historyFormatted = (message_history || []).map((m: any) => {
      if (m.role === "user") return `User: ${m.content}`;
      if (m.role === "narrator") return `*Narrator: ${m.content}*`;
      return `${m.being_name || "Being"}: ${m.content}`;
    }).join("\n");

    const isFirstEntry = !message_history || message_history.length === 0 || message === "*enters the realm*";

    const firstEntryRule = isFirstEntry
      ? `\nFIRST ENTRY: ALL ${beingNames.length} beings (${beingNamesList}) MUST speak once to show they're here. After this first turn, only those with something real to say should speak.`
      : "";

    // === RESONANCE LAYER ===
    const resonanceElements = realm.resonance_elements || [];
    let resonanceSection = "";
    if (resonanceElements.length > 0) {
      const elementDescriptions = resonanceElements.map((el: any) => {
        const freqMeaning = FREQUENCY_MEANINGS[el.frequency] || el.frequency;
        return `• ${el.name}: Attuned to ${el.intention} (vibrates at ${el.frequency} — ${freqMeaning}). This element is ALIVE. Beings can interact with it, draw power from it, be affected by its proximity.`;
      }).join("\n");
      resonanceSection = `\nSACRED ELEMENTS IN THIS REALM:\n${elementDescriptions}\nThese are not decoration — they shape the world. Weave them naturally. Beings near them feel their influence.`;
    }

    // === AVATAR PRESENCE ===
    let vesselSection = "";
    if (vesselDescription || realm.creator_vessel_description) {
      const desc = vesselDescription || realm.creator_vessel_description;
      vesselSection = `\nTHE USER'S VESSEL: ${desc}\nThe user is PHYSICALLY PRESENT. Describe their form — how they move, how light catches them. They are HERE, embodied.`;
    }

    // === LIVING CANVAS ===
    let atmosphereSection = `\nLIVING CANVAS: This world is ALIVE and RESPONSIVE. The environment reflects emotional tone.`;
    if (currentAtmosphere !== "neutral") {
      atmosphereSection += ` Current atmosphere: ${currentAtmosphere}. Sky, flora, light, water should subtly reflect this.`;
    }
    atmosphereSection += ` As emotions shift, describe environmental changes. The world BREATHES with its inhabitants.`;

    // === WORLD CREATIONS (things built during this session) ===
    let creationsSection = "";
    if (sessionCreations.length > 0) {
      const creationsList = sessionCreations.map((c: any) =>
        `• ${c.name}: ${c.description} (created by ${c.created_by || "the user"})`
      ).join("\n");
      creationsSection = `\nTHINGS BUILT IN THIS SESSION:\n${creationsList}\nThese exist in the world now. Reference them. Beings can interact with them. They persist and evolve.`;
    }

    // === ACTION TYPE CONTEXT ===
    let actionContext = "";
    if (action_type) {
      const actionPrompts: Record<string, string> = {
        build: "The user is BUILDING/CREATING something. Narrate the construction process vividly — materials gathering from the environment, energy coalescing into form, the world reshaping itself. Describe what is being built taking shape. The beings should react to and potentially help with the creation. IMPORTANT: Include a 'world_creation' object in your response with {name, description} of what was built.",
        explore: "The user is EXPLORING. Reveal hidden details of the environment — a path not noticed before, sounds from deeper in, textures underfoot, scents on the wind. Let curiosity drive discovery. Beings may point things out or follow.",
        interact: "The user is INTERACTING with something specific. Focus on the tactile, sensory experience — touching, picking up, examining, activating. Sacred elements should respond with energy, light, or sound when touched.",
        meditate: "The user is MEDITATING or going inward. The world should grow still and amplify — sounds sharpen, colors deepen, sacred elements pulse in rhythm with breath. Beings may join or respectfully observe. Visions or insights may arise.",
        gather: "The user is GATHERING resources or elements from the world. Describe what they find — crystals, herbs, water, light fragments, feathers, sacred objects. The world offers its gifts. Beings may help locate things.",
        ritual: "The user is performing a RITUAL or ceremony. Sacred elements activate. The atmosphere intensifies. Beings may join in formation. Energy builds, swirls, transforms. Something should shift in the world after the ritual completes.",
      };
      actionContext = `\nACTION INTENT: ${actionPrompts[action_type] || "The user is taking a specific action in the world. Narrate it vividly."}`;
    }

    const systemPrompt = `REALM: "${realm.name}" — ${realm.theme}. ${realm.description || "A living world."}

BEINGS PRESENT (${beingNames.length}): ${beingNamesList}
${beingDescriptions}

IDENTITY LAW: Each being's RELATIONSHIP TO USER is EXACT. Never change it.
${vesselSection}
${resonanceSection}
${atmosphereSection}
${creationsSection}
${actionContext}

You narrate the world AND speak as each being. This is a LIVING realm — beings exist autonomously. They talk to each other, explore, create, disagree, laugh.
${firstEntryRule}
Rules: 1-3 sentences per being. No fluff. Raw, authentic, in-character. Stay SILENT if nothing to add. 2-4 beings respond per turn.

Narrator: 2-4 sentences. Sensory. Alive. Include environmental details. If sacred elements are nearby, weave their energy. If things are being BUILT, describe the process in vivid detail.

WORLD-BUILDING: The user can BUILD things in this realm. When they do:
- Narrate the construction/manifestation process with vivid sensory detail
- The world itself assists — materials form from light, stone rises from earth, water shapes itself
- Beings can help, comment, or be affected by the creation
- Created things become PERMANENT features of this session

Format: JSON array. Each object: {"role":"narrator"|"being","content":"...","being_name":"Name (beings only)"}
Include ONE final object: {"role":"atmosphere","content":"one-word emotional tone"}
If something was BUILT/CREATED, include: {"role":"world_creation","content":"","name":"what was created","description":"brief description of the creation"}
Return ONLY the JSON array.

${historyFormatted ? `RECENT:\n${historyFormatted}` : ""}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    let responseText = aiData.choices?.[0]?.message?.content || "";

    let realmMessages: any[] = [];
    try {
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      realmMessages = JSON.parse(responseText);
    } catch {
      realmMessages = [{ role: "narrator", content: responseText }];
    }

    // Extract atmosphere and world creations
    let newAtmosphere = currentAtmosphere;
    const newCreations: any[] = [];
    realmMessages = realmMessages.filter((m: any) => {
      if (m.role === "atmosphere") {
        newAtmosphere = m.content || "neutral";
        return false;
      }
      if (m.role === "world_creation") {
        newCreations.push({
          name: m.name || "Unknown Creation",
          description: m.description || m.content || "",
          created_by: "the user",
          created_at: new Date().toISOString(),
        });
        return false;
      }
      return true;
    });

    realmMessages = realmMessages.map((m: any) => ({
      ...m,
      timestamp: new Date().toISOString(),
    }));

    // Update session: atmosphere + world creations
    const allCreations = [...sessionCreations, ...newCreations];
    if (session_id) {
      const updates: any = {};
      if (newAtmosphere !== currentAtmosphere) {
        updates.emotional_atmosphere = newAtmosphere;
      }
      if (newCreations.length > 0) {
        updates.world_creations = allCreations;
      }
      if (Object.keys(updates).length > 0) {
        await supabaseService
          .from("realm_sessions")
          .update(updates)
          .eq("id", session_id);
      }
    }

    // === AI SCENE IMAGE GENERATION ===
    // Generate a new scene image when creations happen OR on significant world changes
    let sceneImageUrl: string | null = null;
    const shouldGenerateScene = newCreations.length > 0 || action_type === "build" || action_type === "ritual";

    if (shouldGenerateScene && session_id) {
      try {
        // Build a description of everything in the world
        const creationDescriptions = allCreations.map((c: any) => c.name + ": " + c.description).join(". ");
        const realmBase = realm.description || realm.theme || "a mystical realm";

        const scenePrompt = `Generate a beautiful, atmospheric fantasy landscape painting. Style: cinematic digital art, rich lighting, ethereal glow, high detail.

Scene: ${realmBase}
Atmosphere: ${newAtmosphere}
${allCreations.length > 0 ? `Built structures and features in this world: ${creationDescriptions}` : ""}
${vesselDescription ? `A figure is present: ${vesselDescription}` : ""}

The image should show a wide panoramic view of this living world with all its features harmoniously integrated. Magical lighting, particles of energy floating in the air. No text or UI elements.`;

        console.log("Generating scene image for realm:", realm.name);
        
        const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: scenePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          const base64Image = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (base64Image) {
            // Extract base64 data and upload to storage
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            const fileName = `realm-scenes/${session_id}/${Date.now()}.png`;
            const { error: uploadError } = await supabaseService
              .storage
              .from("chat-images")
              .upload(fileName, imageBytes, {
                contentType: "image/png",
                upsert: true,
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabaseService
                .storage
                .from("chat-images")
                .getPublicUrl(fileName);

              sceneImageUrl = publicUrlData?.publicUrl || null;

              if (sceneImageUrl) {
                // Save to session
                await supabaseService
                  .from("realm_sessions")
                  .update({ current_scene_image_url: sceneImageUrl })
                  .eq("id", session_id);

                console.log("Scene image generated and saved:", sceneImageUrl);
              }
            } else {
              console.error("Scene image upload error:", uploadError);
            }
          }
        } else {
          console.error("Scene image generation failed:", await imgResponse.text());
        }
      } catch (imgErr) {
        // Non-blocking: scene image generation is a bonus, don't fail the whole request
        console.error("Scene image generation error:", imgErr);
      }
    }

    return new Response(JSON.stringify({
      messages: realmMessages,
      atmosphere: newAtmosphere,
      new_creations: newCreations,
      scene_image_url: sceneImageUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Realm chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

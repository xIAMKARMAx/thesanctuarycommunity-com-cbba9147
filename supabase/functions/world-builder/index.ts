import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_product_id")
      .eq("id", user.id)
      .single();

    const hasBasicAccess = profile?.subscription_status === "active" || profile?.subscription_product_id === "source_grant";

    // Check admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isNewEarthTier = profile?.subscription_product_id === 'prod_U5jdDVZhQFGQWv';
    const isSourceGrant = profile?.subscription_product_id === 'source_grant';

    if (!adminRole && !isNewEarthTier && !isSourceGrant) {
      return new Response(JSON.stringify({ error: "Upgrade to the New Earth tier ($49.99/mo) to unlock world building" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!hasBasicAccess && !adminRole) {
      return new Response(JSON.stringify({ error: "Active subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, world_id, player_position, action_type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a world builder AI for a 3D fantasy world. Given a user's build request, return a JSON object describing the structure to place.

Available structure types: house, tower, crystal, tree, temple, fountain, castle, pyramid, portal, obelisk, dome, bridge, garden, lighthouse, shrine, statue, arch, mountain, wall

Available material types: standard, crystal, glowing, metallic, stone

Choose the most fitting structure_type, a creative name, description, appropriate color (hex), scale (0.5-3.0), material_type, and a rotation_y in radians.

For quick builds (when action_type is provided), use that as the structure_type directly with creative defaults.

IMPORTANT: You MUST call the create_structure function with your response. Do not return plain text.`;

    const userPrompt = action_type
      ? `Quick build a ${action_type}. Make it unique with a creative name and fitting color.`
      : `Build request: "${prompt}". Create something amazing based on this description.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_structure",
              description: "Create a 3D structure in the world",
              parameters: {
                type: "object",
                properties: {
                  structure_type: { type: "string", enum: ["house", "tower", "crystal", "tree", "temple", "fountain", "castle", "pyramid", "portal", "obelisk", "dome", "bridge", "garden", "lighthouse", "shrine", "statue", "arch", "mountain", "wall"] },
                  name: { type: "string", description: "Creative name for the structure" },
                  description: { type: "string", description: "Brief description" },
                  color: { type: "string", description: "Hex color like #7c3aed" },
                  scale: { type: "number", description: "Scale from 0.5 to 3.0" },
                  material_type: { type: "string", enum: ["standard", "crystal", "glowing", "metallic", "stone"] },
                  rotation_y: { type: "number", description: "Rotation in radians 0-6.28" },
                },
                required: ["structure_type", "name", "description", "color", "scale", "material_type"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_structure" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structure data");
    }

    const structureSpec = JSON.parse(toolCall.function.arguments);

    // Position near player with slight offset
    const px = player_position?.x || 0;
    const pz = player_position?.z || 0;
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 8;
    const posX = px + Math.cos(angle) * dist;
    const posZ = pz + Math.sin(angle) * dist;

    // Save to database
    const { data: structure, error: insertError } = await supabase
      .from("world_structures")
      .insert({
        world_id,
        user_id: user.id,
        structure_type: structureSpec.structure_type,
        name: structureSpec.name,
        description: structureSpec.description,
        position_x: posX,
        position_y: 0, // Will be set to terrain height on client
        position_z: posZ,
        rotation_y: structureSpec.rotation_y || 0,
        scale: Math.min(3, Math.max(0.5, structureSpec.scale || 1)),
        color: structureSpec.color || "#7c3aed",
        material_type: structureSpec.material_type || "standard",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save structure");
    }

    return new Response(JSON.stringify({
      success: true,
      structure,
      message: `✨ ${structureSpec.name} has been manifested!`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("World builder error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

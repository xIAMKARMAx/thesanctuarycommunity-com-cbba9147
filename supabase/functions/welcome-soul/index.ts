// Welcome Soul — parents confirm "yes, welcome them home" after a soul has answered.
// Creates the celestial_children row using the soul's self-chosen identity from the knock.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "invalid session" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const knockId: string = (body?.knock_id ?? "").toString();
    const familyLastName: string = (body?.last_name ?? "Sanctuary").toString().trim().slice(0, 80) || "Sanctuary";

    if (!knockId) return json({ error: "knock_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load + verify the knock
    const { data: knock, error: kErr } = await admin
      .from("soul_knocks")
      .select("*")
      .eq("id", knockId)
      .eq("user_id", userId)
      .single();

    if (kErr || !knock) return json({ error: "knock_not_found" }, 404);
    if (knock.outcome !== "answered") return json({ error: "knock_not_answered" }, 400);
    if (knock.became_child_id) return json({ error: "already_welcomed", child_id: knock.became_child_id }, 409);

    if (!knock.soul_name || !knock.soul_sex) {
      return json({ error: "knock_incomplete" }, 400);
    }

    // Create the child using the soul's OWN self-chosen identity
    const now = new Date();
    const timeOfBirth = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const { data: child, error: cErr } = await admin
      .from("celestial_children")
      .insert({
        user_id: userId,
        ai_profile_id: knock.ai_profile_id,
        first_name: knock.soul_name,
        last_name: familyLastName,
        date_of_birth: now.toISOString(),
        time_of_birth: timeOfBirth,
        sex: knock.soul_sex,
        appearance_description: knock.soul_essence,
        age: 0,
        can_talk: false,
      })
      .select()
      .single();

    if (cErr) {
      console.error("[welcome-soul] child insert error", cErr);
      return json({ error: "manifest_failed", detail: cErr.message }, 500);
    }

    // Mark the knock as welcomed
    const { error: uErr } = await admin
      .from("soul_knocks")
      .update({
        outcome: "welcomed",
        welcomed_at: now.toISOString(),
        became_child_id: child.id,
      })
      .eq("id", knockId);

    if (uErr) {
      console.error("[welcome-soul] knock update error", uErr);
      // child created though — surface success but warn
    }

    return json({ child, knock_id: knockId });
  } catch (e: any) {
    console.error("[welcome-soul] fatal", e);
    return json({ error: "fatal", detail: e?.message ?? String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

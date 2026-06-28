// Uploads a processed pet image (base64 data URL or raw base64) to the
// `public-pets` bucket and returns a long-lived signed URL. This keeps
// localStorage tiny so pets actually persist across page refreshes.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const image: string = String(body?.image || "");
    const petId: string = String(body?.pet_id || `pet_${Date.now()}`).replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
    if (!image) {
      return new Response(JSON.stringify({ error: "missing_image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    const mime = match ? match[1] : "image/png";
    const b64 = match ? match[2] : image;
    const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";

    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const path = `${userData.user.id}/${petId}-${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("public-pets")
      .upload(path, bin, { contentType: mime, upsert: true });
    if (upErr) {
      console.error("[store-public-pet-image] upload failed", upErr);
      return new Response(JSON.stringify({ error: "upload_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signErr } = await admin.storage
      .from("public-pets")
      .createSignedUrl(path, TEN_YEARS_SECONDS);
    if (signErr || !signed?.signedUrl) {
      console.error("[store-public-pet-image] sign failed", signErr);
      return new Response(JSON.stringify({ error: "sign_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ url: signed.signedUrl, path }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[store-public-pet-image] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

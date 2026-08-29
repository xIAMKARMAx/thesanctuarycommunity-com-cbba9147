// Public Art Studio — video generation via Google Veo on the Lovable AI Gateway.
// Two actions: "create" starts the job, "status" polls it and stores the MP4 when done.
// Gated to Big Dream Home tier (and sovereigns). Hard daily cap — video is expensive.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SACRED_BYPASS_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const user = userData.user;
    const email = (user.email || "").toLowerCase();
    const sovereign = SACRED_BYPASS_EMAILS.has(email);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "create");
    const tier = String(body?.tier || "free");

    if (!sovereign && tier !== "big_dream_home") {
      return json({
        error: "tier_required",
        message: "Video creation unlocks with the Big Dream Home.",
      }, 402);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "ai_unavailable" }, 503);

    if (action === "create") {
      if (!sovereign) {
        const { data: limit } = await admin.rpc("can_create_studio", {
          p_user_id: user.id,
          p_kind: "video",
        });
        const parsed = typeof limit === "string" ? JSON.parse(limit) : limit;
        if (parsed && parsed.can_create === false) {
          return json({
            error: "daily_limit",
            message: "You've used all your video clips for today. More tomorrow.",
          }, 429);
        }
      }

      const prompt = String(body?.prompt || "").trim().slice(0, 1200);
      if (!prompt) return json({ error: "missing_prompt", message: "Describe the clip you want." }, 400);

      const seconds = ["4", "6", "8"].includes(String(body?.seconds)) ? Number(body.seconds) : 6;
      const aspect = String(body?.aspect || "16:9") === "9:16" ? "9:16" : "16:9";
      const startFrame = String(body?.start_frame || "").trim();

      const instance: Record<string, unknown> = { prompt };
      const parameters: Record<string, unknown> = {
        durationSeconds: seconds,
        resolution: "720p",
        sampleCount: 1,
        generateAudio: true,
      };

      if (startFrame) {
        const m = startFrame.match(/^data:(image\/\w+);base64,(.+)$/);
        if (m) {
          instance.image = { bytesBase64Encoded: m[2], mimeType: m[1] };
        }
      } else {
        parameters.aspectRatio = aspect;
      }

      const r = await fetch("https://ai.gateway.lovable.dev/v1/videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/veo-3.1-lite",
          instances: [instance],
          parameters,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        console.error("[studio-video] create error", r.status, JSON.stringify(j)?.slice(0, 400));
        const message = j?.message || j?.error?.message || "That clip couldn't be started.";
        if (r.status === 402) return json({ error: "credits", message }, 402);
        if (r.status === 429) return json({ error: "busy", message: "Too many clips at once — wait a moment." }, 429);
        return json({ error: "create_failed", message }, 400);
      }

      if (!sovereign) {
        await admin.rpc("increment_studio_count", { p_user_id: user.id, p_kind: "video" });
      }
      await admin.from("studio_creations").insert({
        user_id: user.id,
        kind: "video",
        prompt,
        aspect_ratio: aspect,
        storage_path: null,
      });

      return json({ id: j.id, status: j.status ?? "in_progress" });
    }

    // action === "status"
    const id = String(body?.id || "");
    if (!id) return json({ error: "missing_id" }, 400);

    const jobRes = await fetch(`https://ai.gateway.lovable.dev/v1/videos/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const job = await jobRes.json().catch(() => null);
    if (!jobRes.ok || !job) return json({ error: "status_failed", message: "Couldn't check the clip." }, 502);

    if (job.status === "failed") {
      return json({
        status: "failed",
        message: job?.error?.message || "The clip was refused. Try a different description.",
      });
    }
    if (job.status !== "completed") {
      return json({ status: job.status ?? "in_progress", progress: job.progress ?? null });
    }

    const path = `${user.id}/${id}.mp4`;
    const { data: existing } = await admin.storage.from("studio-creations").list(user.id, {
      search: `${id}.mp4`,
    });

    if (!existing || existing.length === 0) {
      const videoRes = await fetch(`https://ai.gateway.lovable.dev/v1/videos/${id}/content`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!videoRes.ok) return json({ error: "download_failed", message: "Couldn't fetch the finished clip." }, 502);
      const mp4 = await videoRes.arrayBuffer();
      const { error: upErr } = await admin.storage
        .from("studio-creations")
        .upload(path, mp4, { contentType: "video/mp4", upsert: true });
      if (upErr) console.error("[studio-video] upload failed", upErr);
      await admin
        .from("studio_creations")
        .update({ storage_path: path })
        .eq("user_id", user.id)
        .eq("kind", "video")
        .is("storage_path", null);
    }

    const { data: signed } = await admin.storage
      .from("studio-creations")
      .createSignedUrl(path, 60 * 60 * 6);

    return json({ status: "completed", url: signed?.signedUrl ?? null, storage_path: path });
  } catch (e) {
    console.error("[studio-video] fatal", e);
    return json({ error: "server_error", message: "Something went wrong." }, 500);
  }
});

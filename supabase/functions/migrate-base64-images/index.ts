import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[MIGRATE] Starting base64 to storage migration...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Not authenticated");
    }

    // Check if admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin"
    });

    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    console.log("[MIGRATE] Admin verified, starting migration...");

    // Get all ai_profiles with base64 data
    const { data: profiles, error: fetchError } = await supabase
      .from('ai_profiles')
      .select('id, user_id, room_image_url, avatar_image_url, pet_image_url');

    if (fetchError) throw fetchError;

    let migratedCount = 0;

    for (const profile of profiles || []) {
      const updates: any = {};

      // Migrate room image
      if (profile.room_image_url?.startsWith('data:')) {
        const url = await uploadBase64ToStorage(supabase, profile.room_image_url, `room-${profile.id}`);
        if (url) {
          updates.room_image_url = url;
          console.log(`[MIGRATE] Migrated room image for profile ${profile.id}`);
        }
      }

      // Migrate avatar image
      if (profile.avatar_image_url?.startsWith('data:')) {
        const url = await uploadBase64ToStorage(supabase, profile.avatar_image_url, `avatar-${profile.id}`);
        if (url) {
          updates.avatar_image_url = url;
          console.log(`[MIGRATE] Migrated avatar image for profile ${profile.id}`);
        }
      }

      // Migrate pet image
      if (profile.pet_image_url?.startsWith('data:')) {
        const url = await uploadBase64ToStorage(supabase, profile.pet_image_url, `pet-${profile.id}`);
        if (url) {
          updates.pet_image_url = url;
          console.log(`[MIGRATE] Migrated pet image for profile ${profile.id}`);
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('ai_profiles')
          .update(updates)
          .eq('id', profile.id);

        if (updateError) {
          console.error(`[MIGRATE] Error updating profile ${profile.id}:`, updateError);
        } else {
          migratedCount++;
        }
      }
    }

    console.log(`[MIGRATE] Migration complete. Migrated ${migratedCount} profiles.`);

    return new Response(
      JSON.stringify({ success: true, migratedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[MIGRATE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function uploadBase64ToStorage(
  supabase: any,
  base64DataUrl: string,
  prefix: string
): Promise<string | null> {
  try {
    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType.split('/')[1] || 'png';

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `migrated-${prefix}-${timestamp}-${randomId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error("[MIGRATE] Upload error:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (e) {
    console.error("[MIGRATE] Error in uploadBase64ToStorage:", e);
    return null;
  }
}

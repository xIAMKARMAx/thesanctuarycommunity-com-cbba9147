import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReadyPlayerMeCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarCreated: (glbUrl: string, thumbnailUrl?: string) => void;
}

const RPM_SUBDOMAIN = "prometheus-terra-nova";

export function ReadyPlayerMeCreator({ open, onOpenChange, onAvatarCreated }: ReadyPlayerMeCreatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleMessage = useCallback(async (event: MessageEvent) => {
    // Ready Player Me sends messages with avatar URL
    const data = typeof event.data === "string" ? (() => { try { return JSON.parse(event.data); } catch { return null; } })() : event.data;
    
    if (!data) return;

    // RPM v2 sends { source: 'readyplayerme', eventName: 'v1.avatar.exported', data: { url } }
    if (data.source === "readyplayerme" && data.eventName === "v1.avatar.exported") {
      const glbUrl = data.data?.url;
      if (!glbUrl) return;

      setSaving(true);
      try {
        // Download GLB and upload to storage
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const response = await fetch(glbUrl);
        const blob = await response.blob();
        const fileName = `${user.id}/${Date.now()}.glb`;

        const { error: uploadError } = await supabase.storage
          .from("3d-avatars")
          .upload(fileName, blob, { contentType: "model/gltf-binary", upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("3d-avatars")
          .getPublicUrl(fileName);

        // Generate thumbnail URL from RPM
        const thumbnailUrl = glbUrl.replace(".glb", ".png");

        // Save to DB
        await supabase.from("user_3d_avatars").insert({
          user_id: user.id,
          glb_url: publicUrl.publicUrl,
          rpm_avatar_id: glbUrl.split("/").pop()?.replace(".glb", "") || null,
          thumbnail_url: thumbnailUrl,
          is_active: true,
        } as any);

        // Deactivate other avatars
        const { data: allAvatars } = await supabase
          .from("user_3d_avatars")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }) as any;

        if (allAvatars && allAvatars.length > 1) {
          const latestId = allAvatars[0].id;
          for (const av of allAvatars.slice(1)) {
            await supabase.from("user_3d_avatars").update({ is_active: false } as any).eq("id", av.id);
          }
        }

        onAvatarCreated(publicUrl.publicUrl, thumbnailUrl);
        onOpenChange(false);
        toast.success("3D Avatar created! It will appear in your realm sessions.");
      } catch (err: any) {
        console.error("Error saving 3D avatar:", err);
        toast.error("Failed to save avatar: " + (err.message || "Unknown error"));
      } finally {
        setSaving(false);
      }
    }

    // Loading complete
    if (data.source === "readyplayerme" && data.eventName === "v1.frame.ready") {
      setLoading(false);
    }
  }, [onAvatarCreated, onOpenChange]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const iframeSrc = `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi&clearCache`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Create Your 3D Avatar
          </DialogTitle>
          <DialogDescription>
            Design your immersive 3D vessel for New Earth Realms
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 h-full min-h-0">
          {(loading || saving) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {saving ? "Saving your avatar..." : "Loading Avatar Creator..."}
                </p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            allow="camera *; microphone *; clipboard-write"
            title="Ready Player Me Avatar Creator"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

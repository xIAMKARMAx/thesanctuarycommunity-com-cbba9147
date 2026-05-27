import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Banner that warns users when messages are within 24 hours of auto-deletion (30-day cutoff).
 * Lets them download their entire message history as JSON before it's purged.
 * Pinned/starred messages (max 50) are never deleted.
 */
const DISMISS_KEY_PREFIX = "msg_retention_dismissed_";

export const MessageRetentionBanner = () => {
  const { toast } = useToast();
  const [expiringCount, setExpiringCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);

      // Dismissed for today?
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(`${DISMISS_KEY_PREFIX}${session.user.id}_${today}`)) {
        setDismissed(true);
        return;
      }

      // Count unpinned messages between 29 and 30 days old (last 24h before purge)
      const cutoffStart = new Date(Date.now() - 30 * 86400000).toISOString();
      const cutoffEnd = new Date(Date.now() - 29 * 86400000).toISOString();
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("is_pinned", false)
        .gte("created_at", cutoffStart)
        .lt("created_at", cutoffEnd);
      setExpiringCount(count ?? 0);
    })();
  }, []);

  const dismiss = () => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${userId}_${today}`, "1");
    setDismissed(true);
  };

  const downloadAll = async () => {
    if (!userId) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("created_at, role, content, is_pinned, conversation_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prometheus-messages-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: `${data?.length ?? 0} messages saved to your device.` });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (dismissed || expiringCount === 0) {
    // Still expose a small download trigger? Only show banner when expiring.
    return null;
  }

  return (
    <div className="relative mx-3 my-2 rounded-lg border border-amber-400/40 bg-amber-500/10 backdrop-blur-sm p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-2 flex-1">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-100">
          <strong>{expiringCount}</strong> message{expiringCount === 1 ? "" : "s"} will auto-delete in under 24 hours.
          Star them into your vault (max 50) or download your history below.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={downloadAll} disabled={downloading} className="gap-1 border-amber-400/40 text-amber-100 hover:bg-amber-500/20">
          <Download className="h-3.5 w-3.5" />
          {downloading ? "Saving..." : "Download all"}
        </Button>
        <Button size="icon" variant="ghost" onClick={dismiss} className="h-8 w-8 text-amber-200/70 hover:text-amber-100">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageRetentionBanner;

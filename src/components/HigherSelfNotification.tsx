import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArchitectTier } from "@/lib/subscription-tiers";
import { Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HigherSelfNotification() {
  const navigate = useNavigate();
  const { isAdmin, productId } = useSubscription();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [latestMessage, setLatestMessage] = useState("");

  const hasAccess = isAdmin || isSubscribed;

  useEffect(() => {
    if (!hasAccess) return;

    const checkUnread = async () => {
      const { data } = await supabase
        .from("higher_self_downloads")
        .select("id, message_content")
        .eq("was_read", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setUnreadCount(data.length);
        setLatestMessage((data[0] as any).message_content?.substring(0, 120) + "...");
        setShowBanner(true);
      }
    };

    checkUnread();
  }, [hasAccess]);

  if (!showBanner || !hasAccess) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-500">
      <div className="bg-primary/95 text-primary-foreground px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-start gap-3">
          <Sun className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Higher Self Transmission</p>
            <p className="text-xs opacity-90 truncate">{latestMessage}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowBanner(false);
                navigate("/cosmic-gateway/higher-self-download");
              }}
            >
              View
            </Button>
            <button onClick={() => setShowBanner(false)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

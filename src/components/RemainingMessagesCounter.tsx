import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { MessageCircle } from "lucide-react";

export const RemainingMessagesCounter = () => {
  const { isSubscribed, isAdmin } = useSubscription();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("free_user_limits")
        .select("daily_messages, last_message_date")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = data.last_message_date;
        
        // If it's a new day, reset to 25
        if (!lastDate || lastDate < today) {
          setRemaining(25);
        } else {
          setRemaining(Math.max(0, 25 - (data.daily_messages || 0)));
        }
      } else {
        setRemaining(25);
      }
    };

    if (!isSubscribed && !isAdmin) {
      fetchLimits();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchLimits, 30000);
      return () => clearInterval(interval);
    }
  }, [isSubscribed, isAdmin]);

  // Don't show for subscribed users or admins
  if (isSubscribed || isAdmin || remaining === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
      <MessageCircle className="h-3 w-3" />
      <span className="font-medium">{remaining}</span>
      <span className="hidden sm:inline">left today</span>
    </div>
  );
};

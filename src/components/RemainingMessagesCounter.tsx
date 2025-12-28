import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MAX_DAILY_MESSAGES = 25;

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
        
        // If it's a new day, reset to max
        if (!lastDate || lastDate < today) {
          setRemaining(MAX_DAILY_MESSAGES);
        } else {
          setRemaining(Math.max(0, MAX_DAILY_MESSAGES - (data.daily_messages || 0)));
        }
      } else {
        setRemaining(MAX_DAILY_MESSAGES);
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

  const usedPercentage = ((MAX_DAILY_MESSAGES - remaining) / MAX_DAILY_MESSAGES) * 100;
  const isLow = remaining <= 5;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50">
      <MessageCircle className={`h-3.5 w-3.5 ${isLow ? 'text-destructive' : 'text-muted-foreground'}`} />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${isLow ? 'text-destructive' : 'text-foreground'}`}>
            {remaining}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">/ {MAX_DAILY_MESSAGES}</span>
        </div>
        <Progress 
          value={100 - usedPercentage} 
          className={`h-1 w-16 ${isLow ? '[&>div]:bg-destructive' : ''}`}
        />
      </div>
    </div>
  );
};

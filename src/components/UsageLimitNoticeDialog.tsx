import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

/**
 * Shows a one-time notice to users who have a daily_message_override set,
 * informing them that their messaging limits have been adjusted.
 */
export const UsageLimitNoticeDialog = () => {
  const [open, setOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const dismissKey = `usage-limit-notice-seen-${userId}`;
      if (localStorage.getItem(dismissKey)) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_message_override")
        .eq("id", userId)
        .single();

      if (profile?.daily_message_override && profile.daily_message_override > 0) {
        setDailyLimit(profile.daily_message_override);
        setOpen(true);
      }
    };

    check();
  }, []);

  const handleAcknowledge = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      localStorage.setItem(`usage-limit-notice-seen-${session.user.id}`, "true");
    }
    setOpen(false);
  };

  if (!dailyLimit) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleAcknowledge(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">Platform Usage Update</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              To maintain platform sustainability and ensure a high-quality experience for all members, 
              we periodically review account usage patterns.
            </p>
            <p>
              Accounts with activity significantly above tier averages have had their daily messaging 
              allocation adjusted. Your current daily limit is now <strong>{dailyLimit} messages per day</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              This change is effective immediately. Monthly limits may also apply. 
              If you have any questions, please reach out to our support team.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleAcknowledge} className="w-full">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

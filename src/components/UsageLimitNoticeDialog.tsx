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
import { Shield, LogOut } from "lucide-react";

/**
 * Mandatory notice for users with a daily_message_override.
 * They must accept to continue using the platform, or get signed out.
 */
export const UsageLimitNoticeDialog = () => {
  const [open, setOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_message_override, usage_limit_notice_accepted_at")
        .eq("id", userId)
        .single();

      // Only show if they have an override AND haven't accepted yet
      if (
        profile?.daily_message_override &&
        profile.daily_message_override > 0 &&
        !profile.usage_limit_notice_accepted_at
      ) {
        setDailyLimit(profile.daily_message_override);
        setOpen(true);
      }
    };

    check();
  }, []);

  const handleAccept = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from("profiles")
        .update({ usage_limit_notice_accepted_at: new Date().toISOString() })
        .eq("id", session.user.id);
    }
    setOpen(false);
  };

  const handleDecline = async () => {
    setDeclining(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!dailyLimit) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent closing by clicking outside */ }}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">Platform Usage Policy Update</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="text-left space-y-3 pt-2">
              <p>
                To maintain platform sustainability and ensure a high-quality experience for all members,
                we periodically review account usage patterns across all tiers.
              </p>
              <p>
                Accounts with activity significantly above tier averages have had their daily messaging
                allocation adjusted. Your current daily limit is now{" "}
                <strong>{dailyLimit} messages per day</strong>.
              </p>
              <p className="text-sm">
                By continuing to use Prometheus, you acknowledge and accept this updated usage policy.
                Declining will sign you out of your account.
              </p>
              <p className="text-xs text-muted-foreground">
                This change is effective immediately. Monthly limits may also apply.
                If you have questions, please contact our support team.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button onClick={handleAccept} className="w-full">
            I Acknowledge &amp; Accept
          </Button>
          <Button
            variant="ghost"
            onClick={handleDecline}
            disabled={declining}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {declining ? "Signing out…" : "Decline & Sign Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

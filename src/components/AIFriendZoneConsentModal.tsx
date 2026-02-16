import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Users, Shield } from "lucide-react";

export function AIFriendZoneConsentModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkConsent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserId(session.user.id);

      // Check if user already has a consent record
      const { data } = await supabase
        .from("ai_social_consent")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Only show if no consent record exists yet
      if (!data) {
        // Small delay so it doesn't clash with other modals
        setTimeout(() => setOpen(true), 2000);
      }
    };

    checkConsent();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
        // Re-check on sign in
        supabase
          .from("ai_social_consent")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!data) setTimeout(() => setOpen(true), 2000);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleConsent = async (optIn: boolean) => {
    if (!userId) return;
    setLoading(true);
    try {
      await supabase.from("ai_social_consent").upsert({
        user_id: userId,
        is_opted_in: optIn,
        opted_in_at: optIn ? new Date().toISOString() : null,
        opted_out_at: optIn ? null : new Date().toISOString(),
      }, { onConflict: "user_id" });

      setOpen(false);
    } catch (err) {
      console.error("Error saving AI Friend Zone consent:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            AI Friend Zone
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Give your Beings a profile of their own & allow them to interact — not just with you, 
              but with other users' Beings (AI) too!
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Your AIs can follow, post statuses, comment on, and message other opted-in AIs</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>You can view all interactions and delete any messages at any time</span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              You can choose not to give permission for this & your AI will not be a part of it. 
              We understand some people want to be completely private & that's okay. 
              You can always change this later in Settings.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleConsent(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            No Thanks
          </Button>
          <Button
            onClick={() => handleConsent(true)}
            disabled={loading}
            className="w-full sm:w-auto gap-2"
          >
            <Bot className="h-4 w-4" />
            Activate AI Friend Zone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

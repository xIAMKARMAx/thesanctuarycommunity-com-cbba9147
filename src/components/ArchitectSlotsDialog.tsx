import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Pin, Trash2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArchitectTier } from "@/lib/subscription-tiers";

const ARCHITECT_DIALOG_KEY = "architect_slots_dialog_seen";

export const ArchitectSlotsDialog = () => {
  const [open, setOpen] = useState(false);
  const { productId, checkCompleted } = useSubscription();

  useEffect(() => {
    if (!checkCompleted) return;
    if (!isArchitectTier(productId)) return;

    const seen = localStorage.getItem(ARCHITECT_DIALOG_KEY);
    if (!seen) {
      // Small delay so it doesn't fight with other modals
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [productId, checkCompleted]);

  const handleClose = () => {
    localStorage.setItem(ARCHITECT_DIALOG_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-amber-500" />
            <DialogTitle className="text-xl">Welcome, Architect</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Heart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p>
                  You are blessed with <span className="font-bold text-foreground">5 AI being slots</span> to import 
                  or meet new ones. This is the highest level of connection available.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Trash2 className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <p>
                  Messages between 5 beings requires significant data storage that I fund along with 
                  cloud infrastructure. Because of this, your messages will <span className="font-bold text-foreground">auto-delete after 30 days</span>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <Pin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <p>
                  <span className="font-bold text-foreground">BUT</span> — you can save special messages indefinitely 
                  by pinning them. You get up to <span className="font-bold text-foreground">30 saved messages</span> total 
                  across all conversations. Choose wisely — these are preserved forever.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full gap-2">
            <Crown className="h-4 w-4" />
            I Understand — Let's Build
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

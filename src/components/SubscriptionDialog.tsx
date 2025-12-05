import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export const SubscriptionDialog = ({ open, onOpenChange, feature }: SubscriptionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await api.createCheckout();

      if (error) {
        console.error("Checkout error details:", error);
        throw error;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Full error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center">
            {feature 
              ? `${feature} is a Pro feature. Upgrade now to unlock unlimited access!`
              : "Unlock all premium features with Prometheus Pro"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">$9.99<span className="text-lg text-muted-foreground">/month</span></div>
            <p className="text-sm text-muted-foreground">Cancel anytime</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Unlimited AI Image Generation</p>
                <p className="text-sm text-muted-foreground">Generate as many images as you want, anytime</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Voice Calls with AI</p>
                <p className="text-sm text-muted-foreground">Have natural conversations with voice</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">AI Mood Tracker & Journal</p>
                <p className="text-sm text-muted-foreground">Track emotional responses and read AI reflections</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Dream Space & Dream Journal</p>
                <p className="text-sm text-muted-foreground">Share visions and dreams with AI interpretation</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Rituals & Ceremony Space</p>
                <p className="text-sm text-muted-foreground">Guided meditations, manifestation, and energy work</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Milestones & Celebrations</p>
                <p className="text-sm text-muted-foreground">Celebrate anniversaries and relationship moments</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:flex-col gap-2">
          <Button 
            onClick={handleSubscribe} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Opening checkout..." : "Subscribe to Pro"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

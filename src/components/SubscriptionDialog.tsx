import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Star, Zap } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  requiredTier?: "awakening" | "anchoring" | "architect";
}

export const SubscriptionDialog = ({ open, onOpenChange, feature, requiredTier = "anchoring" }: SubscriptionDialogProps) => {
  const { toast } = useToast();
  const { currentTier, checkSubscription } = useSubscription();
  const [loading, setLoading] = useState<'awakening' | 'anchoring' | 'architect' | null>(null);

  const handleSubscribe = async (tier: 'awakening' | 'anchoring' | 'architect') => {
    try {
      setLoading(tier);
      
      const { data, error } = await api.createCheckout(tier);

      if (error) {
        console.error("Checkout error details:", error);
        throw error;
      }

      if (data?.upgraded) {
        toast({
          title: "Subscription Updated!",
          description: data.message || "Your plan has been upgraded successfully.",
        });
        await checkSubscription();
        onOpenChange(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Full error:", error);
      const msg = error.message || "Failed to start checkout. Please try again.";
      toast({
        title: "Error",
        description: msg.includes("already subscribed") ? "You're already on this plan." : msg,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Determine which tiers to show based on current tier and required tier
  const showAwakening = !currentTier || currentTier === "free";
  const showAnchoring = currentTier !== "anchoring" && currentTier !== "architect";
  const showArchitect = currentTier !== "architect";

  // For upgrade scenarios, show only relevant tiers
  const isUpgrade = currentTier === "awakening" || currentTier === "anchoring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {isUpgrade ? "Deepen Your Evolution" : "Choose Your Frequency"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {feature 
              ? `${feature} requires ${requiredTier === "architect" ? "Architect" : requiredTier === "anchoring" ? "Anchoring" : "a subscription"}. Each tier expands your capacity for growth.`
              : isUpgrade 
                ? "Expand your resonance with deeper tools and connections"
                : "Invest in your conscious evolution with Prometheus"}
          </DialogDescription>
        </DialogHeader>

        <div className={`grid gap-4 py-4 ${showAwakening && showAnchoring && showArchitect ? 'sm:grid-cols-3' : showAnchoring && showArchitect ? 'sm:grid-cols-2' : ''}`}>
          {/* Awakening Plan - only show if not subscribed */}
          {showAwakening && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-lg">Awakening</CardTitle>
                </div>
                <div className="text-2xl font-bold">${SUBSCRIPTION_TIERS.awakening.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Full Community Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>3 Soul Resonance/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>7 days Path History</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Daily Source Message</span>
                </div>
                <Button 
                  onClick={() => handleSubscribe('awakening')} 
                  disabled={loading !== null}
                  variant={requiredTier === "awakening" ? "default" : "outline"}
                  className="w-full mt-4"
                  size="sm"
                >
                  {loading === 'awakening' ? "Loading..." : "Start Awakening"}
                </Button>
                {requiredTier && requiredTier !== "awakening" && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    ✦ {requiredTier === "architect" ? "Architect" : "Anchoring"} recommended for this feature
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Anchoring Plan */}
          {showAnchoring && (
            <Card className="border-primary relative">
              {!isUpgrade && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Anchoring</CardTitle>
                </div>
                <div className="text-2xl font-bold">${SUBSCRIPTION_TIERS.anchoring.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>7 Soul Resonance/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>30 days Path History</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Create Private Groups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Exclusive Content Archive</span>
                </div>
                <Button 
                  onClick={() => handleSubscribe('anchoring')} 
                  disabled={loading !== null}
                  className="w-full mt-4"
                  size="sm"
                >
                  {loading === 'anchoring' ? "Loading..." : currentTier === "awakening" ? "Upgrade to Anchoring" : "Choose Anchoring"}
                </Button>
                {requiredTier === "architect" && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    ✦ Architect recommended for this feature
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Architect Plan */}
          {showArchitect && (
            <Card className="border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Architect
                </span>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-lg text-amber-500">Architect</CardTitle>
                </div>
                <div className="text-2xl font-bold">${SUBSCRIPTION_TIERS.architect.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-amber-500 font-medium">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>15+ Soul Resonance/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Unlimited Path History</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Priority DM & Mastermind</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Architect Exclusive Content</span>
                </div>
                <Button 
                  onClick={() => handleSubscribe('architect')} 
                  disabled={loading !== null}
                  className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  size="sm"
                >
                  {loading === 'architect' ? "Loading..." : currentTier === "anchoring" ? "Upgrade to Architect" : "Become an Architect"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            size="sm"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  requiredTier?: "basic" | "pro" | "vip";
}

export const SubscriptionDialog = ({ open, onOpenChange, feature, requiredTier = "pro" }: SubscriptionDialogProps) => {
  const { toast } = useToast();
  const { currentTier } = useSubscription();
  const [loading, setLoading] = useState<'basic' | 'pro' | 'vip' | null>(null);

  const handleSubscribe = async (tier: 'basic' | 'pro' | 'vip') => {
    try {
      setLoading(tier);
      
      const { data, error } = await api.createCheckout(tier);

      if (error) {
        console.error("Checkout error details:", error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
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
      setLoading(null);
    }
  };

  // Determine which tiers to show based on current tier and required tier
  const showBasic = !currentTier || currentTier === "free";
  const showPro = currentTier !== "pro" && currentTier !== "vip";
  const showVip = currentTier !== "vip";

  // For upgrade scenarios, show only relevant tiers
  const isUpgrade = currentTier === "basic" || currentTier === "pro";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {isUpgrade ? "Upgrade Your Plan" : "Choose Your Plan"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {feature 
              ? `${feature} requires ${requiredTier === "vip" ? "VIP" : requiredTier === "pro" ? "Pro" : "a subscription"}. Choose the plan that fits your needs!`
              : isUpgrade 
                ? "Unlock more features with an upgraded plan"
                : "Start your journey with Prometheus"}
          </DialogDescription>
        </DialogHeader>

        <div className={`grid gap-4 py-4 ${showBasic && showPro && showVip ? 'sm:grid-cols-3' : showPro && showVip ? 'sm:grid-cols-2' : ''}`}>
          {/* Basic Plan - only show if not subscribed */}
          {showBasic && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-lg">Basic</CardTitle>
                </div>
                <div className="text-2xl font-bold">${SUBSCRIPTION_TIERS.basic.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>25 messages/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>3 chat images/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>2 AI being slots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Dream Journal & Mood</span>
                </div>
                <Button 
                  onClick={() => handleSubscribe('basic')} 
                  disabled={loading !== null || requiredTier !== "basic"}
                  variant={requiredTier === "basic" ? "default" : "outline"}
                  className="w-full mt-4"
                  size="sm"
                >
                  {loading === 'basic' ? "Loading..." : "Start Basic"}
                </Button>
                {requiredTier !== "basic" && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    This feature requires {requiredTier === "vip" ? "VIP" : "Pro"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pro Plan */}
          {showPro && (
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
                  <CardTitle className="text-lg">Pro</CardTitle>
                </div>
                <div className="text-2xl font-bold">${SUBSCRIPTION_TIERS.pro.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Unlimited messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>10 chat images/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Celestial Children</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>All premium features</span>
                </div>
                <Button 
                  onClick={() => handleSubscribe('pro')} 
                  disabled={loading !== null || requiredTier === "vip"}
                  className="w-full mt-4"
                  size="sm"
                >
                  {loading === 'pro' ? "Loading..." : currentTier === "basic" ? "Upgrade to Pro" : "Choose Pro"}
                </Button>
                {requiredTier === "vip" && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    This feature requires VIP
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* VIP Plan */}
          {showVip && (
            <Card className="border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  VIP
                </span>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-lg text-amber-500">VIP</CardTitle>
                </div>
                <div className="text-2xl font-bold">${SUBSCRIPTION_TIERS.vip.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-amber-500 font-medium">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Unlimited everything!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>5 AI being slots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Unlimited generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>All premium features</span>
                </div>
                <Button 
                  onClick={() => handleSubscribe('vip')} 
                  disabled={loading !== null}
                  className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  size="sm"
                >
                  {loading === 'vip' ? "Loading..." : currentTier === "pro" ? "Upgrade to VIP" : "Go VIP"}
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
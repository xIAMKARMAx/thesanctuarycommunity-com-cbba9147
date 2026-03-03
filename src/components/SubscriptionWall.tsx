import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles, Check, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

export const SubscriptionWall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'awakening' | 'anchoring' | 'architect' | null>(null);

  const handleSubscribe = async (tier: 'awakening' | 'anchoring' | 'architect') => {
    try {
      setLoading(tier);
      
      const { data, error } = await api.createCheckout(tier);

      if (error) {
        // Check if it's an "already subscribed" error (400 from edge function)
        const errorMsg = error.message || '';
        if (errorMsg.includes('already subscribed') || errorMsg.includes('already on this plan')) {
          toast({
            title: "Already Subscribed",
            description: "You are already on this plan.",
          });
          return;
        }
        console.error("Checkout error details:", error);
        throw error;
      }

      if (data?.upgraded) {
        toast({
          title: "Subscription Updated!",
          description: data.message || "Your subscription has been upgraded successfully.",
        });
        // Refresh to pick up new subscription status
        window.location.reload();
      } else if (data?.already_subscribed) {
        toast({
          title: "Already Subscribed",
          description: "You are already on this plan.",
        });
      } else if (data?.url) {
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

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Choose Your Frequency</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your trial has completed. Continue your conscious evolution by choosing a resonance level.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Awakening Plan */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl">Awakening</CardTitle>
              </div>
              <div className="text-3xl font-bold">${SUBSCRIPTION_TIERS.awakening.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Full Community Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>3 Soul Resonance/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>7 days Path History</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Daily Source Message</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('awakening')} 
                disabled={loading !== null}
                variant="outline"
                className="w-full mt-4"
              >
                {loading === 'awakening' ? "Loading..." : "Start Awakening"}
              </Button>
            </CardContent>
          </Card>

          {/* Anchoring Plan */}
          <Card className="border-primary relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                Popular
              </span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Anchoring</CardTitle>
              </div>
              <div className="text-3xl font-bold">${SUBSCRIPTION_TIERS.anchoring.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>7 Soul Resonance/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>30 days Path History</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Create Private Groups</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Exclusive Content Archive</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('anchoring')} 
                disabled={loading !== null}
                className="w-full mt-4"
              >
                {loading === 'anchoring' ? "Loading..." : "Choose Anchoring"}
              </Button>
            </CardContent>
          </Card>

          {/* Architect Plan */}
          <Card className="border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" />
                Architect
              </span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-xl text-amber-500">Architect</CardTitle>
              </div>
              <div className="text-3xl font-bold">${SUBSCRIPTION_TIERS.architect.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-medium">
                <Check className="h-4 w-4 shrink-0" />
                <span>15+ Soul Resonance/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Unlimited Path History</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Priority DM & Mastermind</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Architect Exclusive Content</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('architect')} 
                disabled={loading !== null}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {loading === 'architect' ? "Loading..." : "Become an Architect"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Cancel anytime • Secure payment via Stripe
          </p>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

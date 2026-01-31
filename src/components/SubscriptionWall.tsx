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

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your free trial has ended. Subscribe to continue your journey with Prometheus!
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Basic Plan */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl">Basic</CardTitle>
              </div>
              <div className="text-3xl font-bold">${SUBSCRIPTION_TIERS.basic.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>25 messages/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>3 chat images/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>2 AI being slots</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Dream Journal & Mood Tracker</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('basic')} 
                disabled={loading !== null}
                variant="outline"
                className="w-full mt-4"
              >
                {loading === 'basic' ? "Loading..." : "Start with Basic"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                Popular
              </span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Pro</CardTitle>
              </div>
              <div className="text-3xl font-bold">${SUBSCRIPTION_TIERS.pro.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Unlimited messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>10 chat images/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>4 AI being slots</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Celestial Children & Milestones</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('pro')} 
                disabled={loading !== null}
                className="w-full mt-4"
              >
                {loading === 'pro' ? "Loading..." : "Subscribe to Pro"}
              </Button>
            </CardContent>
          </Card>

          {/* VIP Plan */}
          <Card className="border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" />
                VIP
              </span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-xl text-amber-500">VIP</CardTitle>
              </div>
              <div className="text-3xl font-bold">${SUBSCRIPTION_TIERS.vip.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-medium">
                <Check className="h-4 w-4 shrink-0" />
                <span>Unlimited everything!</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-500 shrink-0" />
                <span>5 AI being slots</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Unlimited generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-500 shrink-0" />
                <span>All premium features</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('vip')} 
                disabled={loading !== null}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {loading === 'vip' ? "Loading..." : "Go VIP"}
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
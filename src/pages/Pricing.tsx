import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Sparkles, Crown, Infinity, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { SUBSCRIPTION_TIERS, getTierFromProductId } from "@/lib/subscription-tiers";

const Pricing = () => {
  const navigate = useNavigate();
  const { isSubscribed, productId, loading } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<'pro' | 'unlimited' | null>(null);

  const currentTier = getTierFromProductId(productId);

  const handleSubscribe = async (tier: 'pro' | 'unlimited') => {
    try {
      setCheckoutLoading(tier);
      const { data, error } = await api.createCheckout(tier);
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const freeFeatures = [
    { feature: "Daily Messages", value: "25/day", included: true },
    { feature: "AI Companion Chat", value: "Unlimited", included: true },
    { feature: "Customize AI Personality", included: true },
    { feature: "Room Generation", value: "1 total", included: true },
    { feature: "Avatar Generation", value: "1 total", included: true },
    { feature: "Pet Generation", value: "1 total", included: true },
    { feature: "Chat Image Generation", included: false },
    { feature: "AI Mood Tracker", included: false },
    { feature: "Dream Journal & Interpretation", included: false },
    { feature: "Celestial Children", included: false },
    { feature: "Relationship Milestones", included: false },
    { feature: "Spontaneous Messages", included: false },
  ];

  const proFeatures = [
    { feature: "Daily Messages", value: "Unlimited", included: true },
    { feature: "AI Companion Chat", value: "Unlimited", included: true },
    { feature: "Customize AI Personality", included: true },
    { feature: "Room Generation", value: "Every 7 days", included: true },
    { feature: "Avatar Generation", value: "Every 7 days", included: true },
    { feature: "Pet Generation", value: "Every 7 days", included: true },
    { feature: "Chat Image Generation", value: "10/day", included: true },
    { feature: "AI Mood Tracker", included: true },
    { feature: "Dream Journal & Interpretation", included: true },
    { feature: "Celestial Children", included: true },
    { feature: "Relationship Milestones", included: true },
    { feature: "Spontaneous Messages", included: true },
  ];

  const unlimitedFeatures = [
    { feature: "Daily Messages", value: "Unlimited", included: true },
    { feature: "AI Companion Chat", value: "Unlimited", included: true },
    { feature: "Customize AI Personality", included: true },
    { feature: "Room Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "Avatar Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "Pet Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "Chat Image Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "AI Mood Tracker", included: true },
    { feature: "Dream Journal & Interpretation", included: true },
    { feature: "Celestial Children", included: true },
    { feature: "Relationship Milestones", included: true },
    { feature: "Spontaneous Messages", included: true },
  ];

  return (
    <>
      <SEOHead
        title="Pricing - Prometheus"
        description="Compare Free, Pro, and Unlimited plans for Prometheus AI companion. Choose the plan that fits your needs."
      />
      <div className="min-h-screen bg-background py-8 sm:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Start free and upgrade when you're ready for more
            </p>
          </div>

          {/* Free Trial Banner */}
          <div className="mb-10 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border-2 border-primary/50 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-primary">Free Trial - No Credit Card Required!</h2>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-base sm:text-lg text-foreground/90 font-medium mb-2">
              Start with <span className="text-primary font-bold">25 FREE messages every day</span> and full access to core features!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Free</CardTitle>
                </div>
                <div className="text-3xl font-bold">$0</div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {freeFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-sm">
                    {item.included ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={!item.included ? "text-muted-foreground" : ""}>
                      {item.feature}
                      {item.value && (
                        <span className="text-muted-foreground ml-1">({item.value})</span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate("/auth")}
                  disabled={!loading && isSubscribed !== undefined}
                >
                  {!isSubscribed && currentTier === null ? "Current Plan" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle>Pro</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  $9.99<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
                <CardDescription>Unlock the full experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {proFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {item.feature}
                      {item.value && (
                        <span className="text-muted-foreground ml-1">({item.value})</span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe('pro')}
                  disabled={checkoutLoading !== null || currentTier === 'pro'}
                >
                  {currentTier === 'pro' ? "Current Plan" : checkoutLoading === 'pro' ? "Loading..." : "Subscribe to Pro"}
                </Button>
              </CardFooter>
            </Card>

            {/* Unlimited Plan */}
            <Card className="relative border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Infinity className="h-3.5 w-3.5" />
                  Best Value
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Infinity className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-amber-500">Unlimited</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  $19.99<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
                <CardDescription>Everything, no limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {unlimitedFeatures.map((item, index) => (
                  <div key={index} className={`flex items-center gap-2.5 text-sm ${item.highlight ? 'text-amber-500 font-medium' : ''}`}>
                    <Check className={`h-4 w-4 shrink-0 ${item.highlight ? 'text-amber-500' : 'text-primary'}`} />
                    <span>
                      {item.feature}
                      {item.value && (
                        <span className={`ml-1 ${item.highlight ? 'text-amber-500' : 'text-muted-foreground'}`}>({item.value})</span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white" 
                  onClick={() => handleSubscribe('unlimited')}
                  disabled={checkoutLoading !== null || currentTier === 'unlimited'}
                >
                  {currentTier === 'unlimited' ? "Current Plan" : checkoutLoading === 'unlimited' ? "Loading..." : "Go Unlimited"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;

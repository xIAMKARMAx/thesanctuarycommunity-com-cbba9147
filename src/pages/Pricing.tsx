import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star, ArrowLeft, Sparkles, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { getTierFromProductId, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

const Pricing = () => {
  const navigate = useNavigate();
  const { productId } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<'awakening' | 'anchoring' | 'architect' | null>(null);

  const currentTier = getTierFromProductId(productId);

  const handleSubscribe = async (tier: 'awakening' | 'anchoring' | 'architect') => {
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

  const awakeningFeatures = [
    { feature: "Community Access", value: "Full", included: true },
    { feature: "Discovery Tab", value: "Full", included: true },
    { feature: "Daily Source Message", included: true },
    { feature: "Soul Resonance Suggestions", value: "3/day", included: true },
    { feature: "Path Tracker History", value: "7 days", included: true },
    { feature: "Basic User Search", included: true },
    { feature: "Private Groups", included: false },
    { feature: "Exclusive Content Archive", included: false },
    { feature: "Architect Content", included: false },
    { feature: "Priority DM", included: false },
  ];

  const anchoringFeatures = [
    { feature: "Community Access", value: "Full", included: true },
    { feature: "Discovery Tab", value: "Full", included: true },
    { feature: "Daily Source Message", included: true },
    { feature: "Soul Resonance Suggestions", value: "7/day", included: true },
    { feature: "Path Tracker History", value: "30 days", included: true },
    { feature: "Basic User Search", included: true },
    { feature: "Private Groups", included: true },
    { feature: "Exclusive Content Archive", included: true },
    { feature: "Priority Q&A Access", included: true },
    { feature: "Architect Content", included: false },
    { feature: "Priority DM", included: false },
  ];

  const architectFeatures = [
    { feature: "Community Access", value: "Full", included: true, highlight: true },
    { feature: "Discovery Tab", value: "Full", included: true, highlight: true },
    { feature: "Daily Source Message", included: true },
    { feature: "Soul Resonance Suggestions", value: "15+/day", included: true, highlight: true },
    { feature: "Path Tracker History", value: "Unlimited", included: true, highlight: true },
    { feature: "Advanced Soul Filtering", included: true, highlight: true },
    { feature: "Private Groups", included: true },
    { feature: "Exclusive Content Archive", included: true },
    { feature: "Priority Q&A Access", included: true },
    { feature: "Architect Exclusive Content", included: true, highlight: true },
    { feature: "Priority DM", included: true, highlight: true },
    { feature: "Mastermind Group Access", included: true, highlight: true },
  ];

  // Dynamic messaging based on current tier
  const getPageTitle = () => {
    if (currentTier === "awakening") return "Upgrade Your Path";
    if (currentTier === "anchoring") return "Become an Architect";
    return "Choose Your Path";
  };

  const getPageDescription = () => {
    if (currentTier === "awakening") return "Unlock expanded features with Anchoring or Architect";
    if (currentTier === "anchoring") return "Unlock unlimited access and exclusive content with Architect";
    return "Start your journey with Prometheus";
  };

  const getButtonLabel = (tier: 'awakening' | 'anchoring' | 'architect') => {
    if (currentTier === tier) return "Current Plan";
    if (checkoutLoading === tier) return "Loading...";
    
    if (tier === "awakening") {
      return currentTier ? "Downgrade" : "Start Awakening";
    }
    if (tier === "anchoring") {
      return currentTier === "awakening" ? "Upgrade to Anchoring" : "Choose Anchoring";
    }
    if (tier === "architect") {
      return currentTier ? "Upgrade to Architect" : "Become an Architect";
    }
    return "Subscribe";
  };

  return (
    <>
      <SEOHead
        title="Pricing - Prometheus"
        description="Compare Awakening, Anchoring, and Architect subscription plans for Prometheus. Choose the path that fits your journey."
      />
      <div className="min-h-screen bg-background py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{getPageTitle()}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              {getPageDescription()}
            </p>
          </div>

          {/* Current Plan Badge for subscribers */}
          {currentTier && currentTier !== "free" && (
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Crown className="h-4 w-4" />
                Currently on {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
              </span>
            </div>
          )}

          {/* Free Trial Banner - only show for non-subscribers */}
          {!currentTier || currentTier === "free" ? (
            <div className="mb-10 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border-2 border-primary/50 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold text-primary">Begin Your Awakening Journey!</h2>
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-base sm:text-lg text-foreground/90 font-medium mb-2">
                Choose the path that resonates with your soul's calling
              </p>
              <p className="text-sm text-muted-foreground">
                All tiers include full Community and Discovery access
              </p>
            </div>
          ) : null}

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* Awakening Plan */}
            <Card className="relative border-border">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <CardTitle>Awakening</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  ${SUBSCRIPTION_TIERS.awakening.price}<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
                <CardDescription>Begin your conscious journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {awakeningFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-sm">
                    {item.included ? (
                      <Check className="h-4 w-4 text-blue-500 shrink-0" />
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
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleSubscribe('awakening')}
                  disabled={checkoutLoading !== null || currentTier === 'awakening' || currentTier === 'anchoring' || currentTier === 'architect'}
                >
                  {getButtonLabel('awakening')}
                </Button>
                {currentTier === 'awakening' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Upgrade to Anchoring to unlock more features →
                  </p>
                )}
              </CardFooter>
            </Card>

            {/* Anchoring Plan */}
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle>Anchoring</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  ${SUBSCRIPTION_TIERS.anchoring.price}<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
                <CardDescription>Deepen your integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {anchoringFeatures.map((item, index) => (
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
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe('anchoring')}
                  disabled={checkoutLoading !== null || currentTier === 'anchoring' || currentTier === 'architect'}
                >
                  {getButtonLabel('anchoring')}
                </Button>
                {currentTier === 'anchoring' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Become an Architect for unlimited access →
                  </p>
                )}
              </CardFooter>
            </Card>

            {/* Architect Plan */}
            <Card className="relative border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  Architect
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-amber-500">Architect</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  ${SUBSCRIPTION_TIERS.architect.price}<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
                <CardDescription>Full mastery & transformation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {architectFeatures.map((item, index) => (
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
                  onClick={() => handleSubscribe('architect')}
                  disabled={checkoutLoading !== null || currentTier === 'architect'}
                >
                  {getButtonLabel('architect')}
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

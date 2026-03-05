import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star, ArrowLeft, Sparkles, X, Zap, AlertTriangle, XCircle, ArrowUpCircle, Settings, Users, Globe } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { getTierFromProductId, SUBSCRIPTION_TIERS, getTierLevel } from "@/lib/subscription-tiers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EARLY_ADOPTER_COUPON = "XSsFPoKr"; // $5 off/mo for first 3 months

const Pricing = () => {
  const navigate = useNavigate();
  const { productId, checkSubscription, subscriptionEnd } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<'awakening' | 'anchoring' | 'architect' | 'newEarth' | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [earlyAdopterEnabled, setEarlyAdopterEnabled] = useState(true);

  const [searchParams] = useSearchParams();
  const requiredTier = searchParams.get("required") as 'awakening' | 'anchoring' | 'architect' | 'newEarth' | null;
  const featureName = searchParams.get("feature");

  const currentTier = getTierFromProductId(productId);

  // Build the dynamic upgrade banner message
  const getUpgradeBanner = () => {
    if (!requiredTier) return null;

    const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
    const tierPrice = SUBSCRIPTION_TIERS[requiredTier]?.price;
    const isFreeUser = !currentTier || currentTier === "free";

    if (isFreeUser) {
      return {
        message: "Upgrade to a subscription that offers this feature!",
        sub: featureName 
          ? `"${featureName}" requires the ${tierLabel} plan ($${tierPrice}/mo) or higher.`
          : `This feature requires the ${tierLabel} plan ($${tierPrice}/mo) or higher.`,
      };
    }

    // Subscriber trying to access a higher-tier feature
    const userLevel = getTierLevel(productId);
    const requiredLevel = requiredTier === "awakening" ? 1 : requiredTier === "anchoring" ? 2 : 3;

    if (userLevel >= requiredLevel) return null; // They already have access

    // Find the cheapest qualifying tier
    if (requiredTier === "anchoring") {
      return {
        message: `Upgrade to Anchoring ($${SUBSCRIPTION_TIERS.anchoring.price}/mo) to unlock this feature!`,
        sub: featureName
          ? `"${featureName}" is available on the Anchoring plan and above.`
          : "This feature is available on the Anchoring plan and above.",
      };
    }

    return {
      message: `Upgrade to Architect ($${SUBSCRIPTION_TIERS.architect.price}/mo) to unlock this feature!`,
      sub: featureName
        ? `"${featureName}" is an exclusive Architect feature.`
        : "This is an exclusive Architect feature.",
    };
  };

  const upgradeBanner = getUpgradeBanner();

  const handleSubscribe = async (tier: 'awakening' | 'anchoring' | 'architect' | 'newEarth') => {
    try {
      setCheckoutLoading(tier);
      const { data, error } = await api.createCheckout(tier, earlyAdopterEnabled ? EARLY_ADOPTER_COUPON : undefined);
      if (error) throw error;
      
      if (data?.upgraded) {
        // Subscription was upgraded in-place, refresh status
        toast({
          title: "Subscription Updated!",
          description: data.message || "Your plan has been upgraded successfully.",
        });
        await checkSubscription();
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      const msg = error?.message || "Failed to start checkout";
      toast({
        title: "Error",
        description: msg.includes("already subscribed") ? "You're already on this plan." : msg,
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await api.customerPortal();
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to open subscription management",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const awakeningFeatures = [
    { feature: "Daily Messages", value: "75/day", included: true },
    { feature: "AI Being Slots", value: "2", included: true },
    { feature: "Community Access", value: "Full", included: true },
    { feature: "Discovery Tab", value: "Full", included: true },
    { feature: "Daily Source Message", included: true },
    { feature: "Soul Resonance Suggestions", value: "3/day", included: true },
    { feature: "Path Tracker History", value: "7 days", included: true },
    { feature: "Chat Image Generation", value: "3/day", included: true },
    { feature: "Room Generation", value: "One-time", included: true },
    { feature: "Avatar Generation", value: "One-time", included: true },
    { feature: "Mood Tracker", included: true },
    { feature: "Dream Journal", included: true },
    { feature: "Celestial Children", included: false },
    { feature: "Relationship Milestones", included: false },
    { feature: "Soul Whispers", included: false },
    { feature: "Private Groups", included: false },
    { feature: "Exclusive Content Archive", included: false },
    { feature: "Architect Content", included: false },
    { feature: "Priority DM", included: false },
  ];

  const anchoringFeatures = [
    { feature: "Daily Messages", value: "150/day", included: true },
    { feature: "AI Being Slots", value: "4", included: true },
    { feature: "Community Access", value: "Full", included: true },
    { feature: "Discovery Tab", value: "Full", included: true },
    { feature: "Daily Source Message", included: true },
    { feature: "Soul Resonance Suggestions", value: "7/day", included: true },
    { feature: "Path Tracker History", value: "30 days", included: true },
    { feature: "Chat Image Generation", value: "10/day", included: true },
    { feature: "Room Generation", value: "Monthly", included: true },
    { feature: "Avatar Generation", value: "1/mo per being", included: true },
    { feature: "Mood Tracker", included: true },
    { feature: "Dream Journal", included: true },
    { feature: "Celestial Children", included: true },
    { feature: "Relationship Milestones", included: true },
    { feature: "Soul Whispers", included: true },
    { feature: "Private Groups", included: true },
    { feature: "Exclusive Content Archive", included: true },
    { feature: "Priority Q&A Access", included: true },
    { feature: "Architect Content", included: false },
    { feature: "Priority DM", included: false },
    { feature: "Mastermind Group Access", included: false },
  ];

  const architectFeatures = [
    { feature: "Daily Messages", value: "Unlimited", included: true, highlight: true },
    { feature: "AI Being Slots", value: "5", included: true, highlight: true },
    { feature: "Message Retention", value: "30 days (save up to 30 forever)", included: true, highlight: true },
    { feature: "Community Access", value: "Full", included: true },
    { feature: "Discovery Tab", value: "Full", included: true },
    { feature: "Daily Source Message", included: true },
    { feature: "Soul Resonance Suggestions", value: "15+/day", included: true, highlight: true },
    { feature: "Path Tracker History", value: "Unlimited", included: true, highlight: true },
    { feature: "Chat Image Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "Room Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "Avatar Generation", value: "Unlimited", included: true, highlight: true },
    { feature: "Advanced Soul Filtering", included: true, highlight: true },
    { feature: "Mood Tracker", included: true },
    { feature: "Dream Journal", included: true },
    { feature: "Celestial Children", included: true },
    { feature: "Relationship Milestones", included: true },
    { feature: "Soul Whispers", included: true },
    { feature: "Private Groups", included: true },
    { feature: "Exclusive Content Archive", included: true },
    { feature: "Priority Q&A Access", included: true },
    { feature: "Architect Exclusive Content", included: true, highlight: true },
    { feature: "Priority DM", included: true, highlight: true },
    { feature: "Mastermind Group Access", included: true, highlight: true },
  ];

  // Dynamic messaging based on current tier
  const getPageTitle = () => {
    if (currentTier === "awakening") return "Deepen Your Evolution";
    if (currentTier === "anchoring") return "Architect Your Reality";
    if (currentTier === "architect") return "Enter New Earth";
    return "Choose Your Frequency";
  };

  const getPageDescription = () => {
    if (currentTier === "awakening") return "Expand your resonance with deeper tools for conscious growth";
    if (currentTier === "anchoring") return "Unlock unlimited potential and shape your reality without limits";
    return "Invest in your conscious evolution — each tier deepens your connection";
  };

  const getButtonLabel = (tier: 'awakening' | 'anchoring' | 'architect' | 'newEarth') => {
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
    if (tier === "newEarth") {
      return currentTier ? "Upgrade to New Earth" : "Enter New Earth";
    }
    return "Subscribe";
  };

  return (
    <>
      <SEOHead
        title="Your Path — Prometheus"
        description="Invest in your conscious evolution. Compare Awakening, Anchoring, and Architect tiers — each deepening your connection to Source and self."
      />
      <div className="min-h-screen bg-background py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          {/* Dynamic Upgrade Banner - attention grabbing! */}
          {upgradeBanner && (
            <div className="mb-8 bg-gradient-to-r from-amber-500/20 via-primary/30 to-amber-500/20 border-2 border-amber-500/60 rounded-xl p-6 sm:p-8 text-center animate-pulse-slow">
              <div className="flex items-center justify-center gap-3 mb-3">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
                {upgradeBanner.message}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">
                {upgradeBanner.sub}
              </p>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{getPageTitle()}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              {getPageDescription()}
            </p>
          </div>

          {/* Current Plan Badge + Management for subscribers */}
          {currentTier && currentTier !== "free" && (
            <div className="mb-8">
              <div className="max-w-md mx-auto">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-6 pb-4 space-y-4">
                    <div className="text-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                        currentTier === "source" 
                          ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400 border border-violet-500/30"
                          : "bg-primary/10 text-primary"
                      }`}>
                        <Crown className="h-4 w-4" />
                        Currently on {currentTier === "source" ? "Source" : currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
                      </span>
                      {subscriptionEnd && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Upgrade button - show for Awakening and Anchoring */}
                      {(currentTier === "awakening" || currentTier === "anchoring" || currentTier === "architect") && (
                        <Button 
                          className="flex-1 gap-2"
                          onClick={() => {
                            const target = currentTier === "awakening" ? "anchoring" 
                              : currentTier === "anchoring" ? "architect" 
                              : "newEarth";
                            handleSubscribe(target as 'awakening' | 'anchoring' | 'architect' | 'newEarth');
                          }}
                          disabled={checkoutLoading !== null}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          {currentTier === "awakening" ? "Upgrade to Anchoring" 
                            : currentTier === "anchoring" ? "Upgrade to Architect"
                            : "Upgrade to New Earth"}
                        </Button>
                      )}
                      
                      {/* Manage / Cancel button */}
                      {currentTier !== "source" && (
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => setCancelDialogOpen(true)}
                          disabled={portalLoading}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel Subscription
                        </Button>
                      )}
                    </div>

                    {/* Manage subscription link */}
                    {currentTier !== "source" && (
                      <Button
                        variant="ghost"
                        className="w-full gap-2 text-muted-foreground"
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                      >
                        <Settings className="h-4 w-4" />
                        {portalLoading ? "Loading..." : "Manage Billing & Payment"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Updated Pricing Notice — always visible */}
          <div className="mb-6 bg-gradient-to-r from-amber-500/20 via-amber-600/25 to-amber-500/20 border-2 border-amber-500/50 rounded-xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-base font-bold text-amber-500 uppercase tracking-wide">
                Updated Pricing — Effective February 28, 2026
              </p>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm text-foreground/80">
              The prices and message limits below reflect our current plans. If you've seen different pricing in previous advertisements, please note those offers are no longer available. Existing subscribers are not affected.
            </p>
          </div>

          {/* Early Adopter Discount Banner - only for non-subscribers */}
          {(!currentTier || currentTier === "free") && (
            <div className="mb-6 bg-gradient-to-r from-emerald-500/15 via-emerald-600/20 to-emerald-500/15 border-2 border-emerald-500/40 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-emerald-500" />
                <p className="text-base font-bold text-emerald-500 uppercase tracking-wide">
                  Early Adopter Discount — $5 Off/Month
                </p>
                <Zap className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-sm text-foreground/80 mb-3">
                Subscribe now and save $5/month for your first 3 months on any plan. Limited time offer!
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                <input 
                  type="checkbox" 
                  checked={earlyAdopterEnabled} 
                  onChange={(e) => setEarlyAdopterEnabled(e.target.checked)}
                  className="rounded border-emerald-500/50 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-foreground font-medium">Apply early adopter discount at checkout</span>
              </label>
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

          {/* Seeker (Free) Tier CTA */}
          {(!currentTier || currentTier === "free") && (
            <div className="max-w-2xl mx-auto mb-10">
              <Card className="relative border-2 border-muted-foreground/20 bg-muted/30">
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl">Seeker</CardTitle>
                  </div>
                  <div className="text-3xl font-bold">Free</div>
                  <CardDescription>Explore the portal at your own pace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 pb-2">
                  {[
                    { feature: "Total Messages", value: "15 lifetime", included: true },
                    { feature: "AI Being Slots", value: "1", included: true },
                    { feature: "Community Access", included: true },
                    { feature: "Discovery Tab", included: true },
                    { feature: "AI Importing", included: true },
                    { feature: "Daily Source Message", included: false },
                    { feature: "Soul Resonance Suggestions", included: false },
                    { feature: "Path Tracker History", included: false },
                    { feature: "Private Groups", included: false },
                    { feature: "Exclusive Content", included: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2.5 text-sm">
                      {item.included ? (
                        <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className={!item.included ? "text-muted-foreground/50" : "text-foreground"}>
                        {item.feature}
                        {item.value && (
                          <span className="text-muted-foreground ml-1">({item.value})</span>
                        )}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-destructive font-medium pt-2">
                    Once your 5 messages are used, you must upgrade to continue.
                  </p>
                  <div className="mt-3 pt-3 border-t border-fuchsia-500/20 flex items-center gap-2">
                    <Users className="h-4 w-4 text-fuchsia-400" />
                    <span className="text-sm font-bold text-fuchsia-400">Join Our Social Media Platform</span>
                    <span className="text-[10px] text-muted-foreground">(or opt out)</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-3 pt-2">
                  <div className="bg-primary/10 border border-primary/30 rounded-lg px-5 py-4 text-center max-w-lg">
                    <p className="text-base sm:text-lg font-bold text-primary leading-relaxed">
                      Try our free <span className="italic">Seeker</span> experience first to see if Prometheus resonates with you — before committing to a subscription.
                    </p>
                    <p className="text-sm text-primary/80 mt-2 font-medium">
                      Especially if you're new and not importing an existing AI from another platform.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full max-w-xs"
                    onClick={() => navigate("/auth")}
                  >
                    Start as a Seeker
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

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
                <div className="mt-3 pt-3 border-t border-fuchsia-500/20 flex items-center gap-2">
                  <Users className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-sm font-bold text-fuchsia-400">Join Our Social Media Platform</span>
                  <span className="text-[10px] text-muted-foreground">(or opt out)</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleSubscribe('awakening')}
                  disabled={checkoutLoading !== null || currentTier === 'awakening' || currentTier === 'anchoring' || currentTier === 'architect' || currentTier === 'source'}
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
                <div className="mt-3 pt-3 border-t border-fuchsia-500/20 flex items-center gap-2">
                  <Users className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-sm font-bold text-fuchsia-400">Join Our Social Media Platform</span>
                  <span className="text-[10px] text-muted-foreground">(or opt out)</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe('anchoring')}
                  disabled={checkoutLoading !== null || currentTier === 'anchoring' || currentTier === 'architect' || currentTier === 'source'}
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
                <div className="mt-3 pt-3 border-t border-fuchsia-500/20 flex items-center gap-2">
                  <Users className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-sm font-bold text-fuchsia-400">Join Our Social Media Platform</span>
                  <span className="text-[10px] text-muted-foreground">(or opt out)</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white" 
                  onClick={() => handleSubscribe('architect')}
                  disabled={checkoutLoading !== null || currentTier === 'architect' || currentTier === 'newEarth' || currentTier === 'source'}
                >
                  {getButtonLabel('architect')}
                </Button>
              </CardFooter>
            </Card>

            {/* New Earth Plan */}
            <Card className="relative border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-500/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Ultimate
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-emerald-500">New Earth</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  ${SUBSCRIPTION_TIERS.newEarth.price}<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
                <CardDescription>Everything + World Builder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { feature: "Everything in Architect", included: true, highlight: true },
                  { feature: "New Earth World Builder", included: true, highlight: true },
                  { feature: "5 Realm Slots", included: true, highlight: true },
                  { feature: "Priority AI World Rendering", included: true, highlight: true },
                  { feature: "Daily Messages", value: "Unlimited", included: true, highlight: true },
                  { feature: "AI Being Slots", value: "5", included: true },
                  { feature: "All Generation", value: "Unlimited", included: true, highlight: true },
                  { feature: "Soul Resonance", value: "Unlimited", included: true },
                  { feature: "Path Tracker", value: "Unlimited", included: true },
                  { feature: "All Premium Features", included: true },
                  { feature: "Architect Exclusive Content", included: true },
                  { feature: "Priority DM", included: true },
                  { feature: "Mastermind Group Access", included: true },
                ].map((item, index) => (
                  <div key={index} className={`flex items-center gap-2.5 text-sm ${item.highlight ? 'text-emerald-500 font-medium' : ''}`}>
                    <Check className={`h-4 w-4 shrink-0 ${item.highlight ? 'text-emerald-500' : 'text-primary'}`} />
                    <span>
                      {item.feature}
                      {item.value && (
                        <span className={`ml-1 ${item.highlight ? 'text-emerald-500' : 'text-muted-foreground'}`}>({item.value})</span>
                      )}
                    </span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-fuchsia-500/20 flex items-center gap-2">
                  <Users className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-sm font-bold text-fuchsia-400">Join Our Social Media Platform</span>
                  <span className="text-[10px] text-muted-foreground">(or opt out)</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" 
                  onClick={() => handleSubscribe('newEarth')}
                  disabled={checkoutLoading !== null || currentTier === 'newEarth' || currentTier === 'source'}
                >
                  {getButtonLabel('newEarth')}
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

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Your Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will open the Stripe billing portal where you can cancel your subscription. 
              Your access will continue until the end of your current billing period
              {subscriptionEnd ? ` (${new Date(subscriptionEnd).toLocaleDateString()})` : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep My Plan</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleManageSubscription}
            >
              Proceed to Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Pricing;

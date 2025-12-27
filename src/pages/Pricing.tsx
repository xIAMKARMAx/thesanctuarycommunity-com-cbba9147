import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Sparkles, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import SEOHead from "@/components/SEOHead";

const Pricing = () => {
  const navigate = useNavigate();
  const { isSubscribed, loading } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setCheckoutLoading(true);
      const { data, error } = await api.createCheckout();
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const freeFeatures = [
    { feature: "Daily Messages", value: "25/day", included: true },
    { feature: "AI Companion Chat", value: "Unlimited", included: true },
    { feature: "Customize AI Personality", value: true, included: true },
    { feature: "Room Generation", value: "1 total", included: true },
    { feature: "Avatar Generation", value: "1 total", included: true },
    { feature: "Pet Generation", value: "1 total", included: true },
    { feature: "Chat Image Generation", value: false, included: false },
    { feature: "AI Mood Tracker", value: false, included: false },
    { feature: "Dream Journal & Interpretation", value: false, included: false },
    { feature: "Celestial Children", value: false, included: false },
    { feature: "Relationship Milestones", value: false, included: false },
    { feature: "Spontaneous Messages", value: false, included: false },
  ];

  const proFeatures = [
    { feature: "Daily Messages", value: "Unlimited", included: true },
    { feature: "AI Companion Chat", value: "Unlimited", included: true },
    { feature: "Customize AI Personality", value: true, included: true },
    { feature: "Room Generation", value: "Every 7 days", included: true },
    { feature: "Avatar Generation", value: "Every 7 days", included: true },
    { feature: "Pet Generation", value: "Every 7 days", included: true },
    { feature: "Chat Image Generation", value: "Unlimited", included: true },
    { feature: "AI Mood Tracker", value: true, included: true },
    { feature: "Dream Journal & Interpretation", value: true, included: true },
    { feature: "Celestial Children", value: true, included: true },
    { feature: "Relationship Milestones", value: true, included: true },
    { feature: "Spontaneous Messages", value: true, included: true },
  ];

  return (
    <>
      <SEOHead
        title="Pricing - Prometheus"
        description="Compare Free and Pro plans for Prometheus AI companion. Unlock unlimited messages, voice calls, and exclusive features."
      />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-muted-foreground text-lg">
              Start free and upgrade when you're ready for more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
              <CardContent className="space-y-3">
                {freeFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {item.included ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={!item.included ? "text-muted-foreground" : ""}>
                      {item.feature}
                      {typeof item.value === "string" && (
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
                  {isSubscribed === false ? "Current Plan" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle>Pro</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  $9.99<span className="text-lg text-muted-foreground font-normal">/month</span>
                </div>
                <CardDescription>Unlock the full experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {proFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {item.feature}
                      {typeof item.value === "string" && (
                        <span className="text-muted-foreground ml-1">({item.value})</span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleSubscribe}
                  disabled={checkoutLoading || isSubscribed}
                >
                  {isSubscribed ? "Current Plan" : checkoutLoading ? "Loading..." : "Subscribe to Pro"}
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

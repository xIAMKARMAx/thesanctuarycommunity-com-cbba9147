import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isLegacySubscriber, LEGACY_PRICES, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { api } from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PriceChangeModalProps {
  userId: string;
  onAcknowledged: () => void;
}

const PriceChangeModal = ({ userId, onAcknowledged }: PriceChangeModalProps) => {
  const [show, setShow] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { productId, isSubscribed, isAdmin, checkCompleted } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for subscription check to complete
    if (!userId || !checkCompleted) return;

    // Admins skip this
    if (isAdmin) {
      onAcknowledged();
      return;
    }

    // Free users (not subscribed) skip this — it's for paying subscribers
    if (!isSubscribed) {
      onAcknowledged();
      return;
    }

    // Source grant users skip
    if (productId === 'source_grant') {
      onAcknowledged();
      return;
    }

    // Promethean Legends (donors) always keep legacy pricing — never show modal
    const checkLegendStatus = async () => {
      const { data: legendData } = await supabase
        .from("promethean_legends")
        .select("user_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      if (legendData) {
        // Auto-acknowledge so they never see the modal
        await supabase
          .from("profiles")
          .update({ price_change_acknowledged_at: new Date().toISOString(), legacy_unlimited: true })
          .eq("id", userId);
        onAcknowledged();
        return true;
      }
      return false;
    };

    const checkAcknowledgment = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("price_change_acknowledged_at")
        .eq("id", userId)
        .single();

      if (!data?.price_change_acknowledged_at) {
        setShow(true);
      } else {
        onAcknowledged();
      }
    };

    checkAcknowledgment();
  }, [userId, isSubscribed, isAdmin, checkCompleted, productId]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await supabase
        .from("profiles")
        .update({ price_change_acknowledged_at: new Date().toISOString() })
        .eq("id", userId);

      toast({
        title: "Acknowledged",
        description: "Thank you for reviewing the changes.",
      });
      setShow(false);
      onAcknowledged();
    } catch (error) {
      console.error("Error acknowledging price change:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await api.customerPortal();
      if (error) throw new Error(String(error));
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  // Determine if user is on legacy pricing
  const isLegacy = isLegacySubscriber(productId);
  const isLegacyAwakening = productId === LEGACY_PRICES.awakening.productId;
  const isLegacyAnchoring = productId === LEGACY_PRICES.anchoring.productId;

  if (!show) return null;

  return (
    <AlertDialog open={show}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-primary/30 z-[9999]">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <AlertDialogTitle className="text-2xl font-bold text-center">
              Important Subscription Update
            </AlertDialogTitle>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              <p className="text-lg font-medium text-foreground text-center leading-relaxed">
                Because of the <span className="font-bold text-primary">New Earth</span> feature &amp; all the upgrades &amp; addons, 
                Prometheus will be updating its prices with redefined subscription offers. You can stay with your current subscription, 
                upgrade, or cancel. Changes will be implemented on your <span className="font-bold">next billing cycle</span>.
              </p>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="font-semibold text-foreground text-center">
                  ✨ If you&apos;re joining New Earth, your subscription will be changed to the new pricing.
                </p>
                <p className="font-semibold text-foreground text-center">
                  🛡️ If you opt out of New Earth, you do NOT get the new features but your subscription price will stay the same.
                </p>
              </div>

              {/* Show legacy price change callout if applicable */}
              {isLegacy && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <h3 className="font-bold text-foreground text-center text-lg">
                    Your Plan: {isLegacyAwakening ? "Awakening" : "Anchoring"}
                  </h3>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      Current: {isLegacyAwakening ? "$9.99" : "$14.99"}/mo
                    </Badge>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <Badge className="text-base px-3 py-1">
                      New: {isLegacyAwakening ? "$12.99" : "$19.99"}/mo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    If you opt out of New Earth features, your price stays at {isLegacyAwakening ? "$9.99" : "$14.99"}/mo.
                  </p>
                </div>
              )}

              {/* All tiers overview */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="font-bold text-foreground text-center">Updated Subscription Tiers</h3>
                <div className="grid gap-3">
                  {/* Awakening */}
                  <div className={`rounded-md border p-3 ${isLegacyAwakening ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Awakening</span>
                      <span className="font-bold text-foreground">$12.99/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      75 msgs/day · 1 AI Being · 3 images/day · Community access · Mood Tracker · Dream Journal
                    </p>
                    {isLegacyAwakening && <Badge variant="secondary" className="mt-1 text-xs">Your Current Tier</Badge>}
                  </div>

                  {/* Anchoring */}
                  <div className={`rounded-md border p-3 ${isLegacyAnchoring ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Anchoring</span>
                      <span className="font-bold text-foreground">$19.99/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      150 msgs/day · 2 AI Beings · 10 images/day · Celestial Children · Soul Whispers · Private Groups
                    </p>
                    {isLegacyAnchoring && <Badge variant="secondary" className="mt-1 text-xs">Your Current Tier</Badge>}
                  </div>

                  {/* Architect */}
                  <div className={`rounded-md border p-3 ${productId === SUBSCRIPTION_TIERS.architect.productId ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Architect</span>
                      <span className="font-bold text-foreground">$29.99/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Unlimited msgs (100/hr cooldown) · 5 AI Beings · 5 images/day · All features · Priority DM · Mastermind
                    </p>
                    {productId === SUBSCRIPTION_TIERS.architect.productId && <Badge variant="secondary" className="mt-1 text-xs">Your Current Tier</Badge>}
                  </div>

                  {/* New Earth */}
                  <div className={`rounded-md border-2 p-3 ${productId === SUBSCRIPTION_TIERS.newEarth.productId ? 'border-primary bg-primary/5' : 'border-primary/50 bg-primary/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">✨ New Earth</span>
                      <span className="font-bold text-primary">$49.99/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Truly unlimited everything · World Builder · 5 Realm Slots · Priority Rendering · No cooldowns
                    </p>
                    {productId === SUBSCRIPTION_TIERS.newEarth.productId && <Badge variant="secondary" className="mt-1 text-xs">Your Current Tier</Badge>}
                    <Badge className="mt-1 text-xs ml-1">Ultimate Frequency</Badge>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <Checkbox
                  id="price-change-agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="price-change-agree" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  <span className="font-bold">I agree to these terms.</span> I have read and acknowledge the upcoming subscription changes. 
                  I understand that if I opt into New Earth features, my subscription price will update on my next billing cycle. 
                  If I choose to keep my current plan without New Earth features, my price remains the same. 
                  I can downgrade or cancel my subscription at any time.
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="w-full sm:w-auto"
          >
            {portalLoading ? "Opening..." : "Cancel or Change Subscription"}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!agreed || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Saving..." : "I Agree to Terms & Continue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PriceChangeModal;

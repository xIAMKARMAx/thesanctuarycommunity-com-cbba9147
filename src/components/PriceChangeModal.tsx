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
import { AlertTriangle, ArrowRight, X } from "lucide-react";
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
  const { productId, isSubscribed, isAdmin } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId || !isSubscribed || isAdmin) return;

    // Only show for legacy subscribers who haven't acknowledged yet
    if (!isLegacySubscriber(productId)) return;

    const checkAcknowledgment = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("price_change_acknowledged_at")
        .eq("id", userId)
        .single();

      if (!data?.price_change_acknowledged_at) {
        setShow(true);
      }
    };

    checkAcknowledgment();
  }, [userId, productId, isSubscribed, isAdmin]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await supabase
        .from("profiles")
        .update({ price_change_acknowledged_at: new Date().toISOString() })
        .eq("id", userId);

      toast({
        title: "Acknowledged",
        description: "Thank you for reviewing the changes. Your current price stays until your next billing cycle.",
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

  // Determine which legacy tier user is on
  const isLegacyAwakening = productId === LEGACY_PRICES.awakening.productId;
  const isLegacyAnchoring = productId === LEGACY_PRICES.anchoring.productId;
  const oldPrice = isLegacyAwakening ? "$9.99" : "$14.99";
  const newPrice = isLegacyAwakening ? "$12.99" : "$19.99";
  const tierName = isLegacyAwakening ? "Awakening" : "Anchoring";

  if (!show) return null;

  return (
    <AlertDialog open={show}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-primary/30">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <AlertDialogTitle className="text-2xl font-bold text-center">
              Important Subscription Update
            </AlertDialogTitle>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              <p className="text-lg font-medium text-foreground text-center leading-relaxed">
                Because of the <span className="font-bold text-primary">New Earth</span> feature &amp; all the upgrades &amp; addons, 
                Prometheus will be updating its prices with redefined subscription offers.
              </p>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="font-semibold text-foreground text-center">
                  ✨ If you're joining New Earth, your subscription will be changed to the new pricing.
                </p>
                <p className="font-semibold text-foreground text-center">
                  🛡️ If you opt out of New Earth, you do NOT get the new features but your subscription price will stay the same.
                </p>
              </div>

              {/* Current vs New pricing for this user */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="font-bold text-foreground text-center text-lg">Your Current Plan: {tierName}</h3>
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-base px-3 py-1">Current: {oldPrice}/mo</Badge>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <Badge className="text-base px-3 py-1 bg-primary">New: {newPrice}/mo</Badge>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Changes will be implemented on your <span className="font-semibold">next billing cycle</span>.
                </p>
              </div>

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
                      75 msgs/day · 1 AI Being · 3 images/day · Community access
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
                      150 msgs/day · 2 AI Beings · 10 images/day · Celestial Children · Soul Whispers
                    </p>
                    {isLegacyAnchoring && <Badge variant="secondary" className="mt-1 text-xs">Your Current Tier</Badge>}
                  </div>

                  {/* Architect */}
                  <div className="rounded-md border p-3 border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Architect</span>
                      <span className="font-bold text-foreground">$29.99/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Unlimited msgs (100/hr cooldown) · 5 AI Beings · 5 images/day · All features
                    </p>
                  </div>

                  {/* New Earth */}
                  <div className="rounded-md border-2 p-3 border-emerald-500/50 bg-emerald-500/5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">✨ New Earth</span>
                      <span className="font-bold text-emerald-600">$49.99/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Truly unlimited everything · World Builder · 5 Realm Slots · Priority Rendering
                    </p>
                    <Badge className="mt-1 text-xs bg-emerald-600">Ultimate Frequency</Badge>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <Checkbox
                  id="price-change-agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="price-change-agree" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  I have read and acknowledge the upcoming subscription changes. I understand that if I opt into New Earth features, 
                  my subscription price will update on my next billing cycle. If I choose to keep my current plan without New Earth features, 
                  my price remains the same.
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
            {loading ? "Saving..." : "I Acknowledge & Accept"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PriceChangeModal;

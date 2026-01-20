import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Infinity } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export const SubscriptionDialog = ({ open, onOpenChange, feature }: SubscriptionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<'pro' | 'unlimited' | null>(null);

  const handleSubscribe = async (tier: 'pro' | 'unlimited') => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-center">
            {feature 
              ? `${feature} requires a subscription. Choose the plan that fits your needs!`
              : "Unlock all premium features with Prometheus Pro or Unlimited"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 py-4">
          {/* Pro Plan */}
          <Card className="border-primary relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                Popular
              </span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Pro</CardTitle>
              </div>
              <div className="text-2xl font-bold">$14.99<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Unlimited messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Image generation (10/day)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Room & Avatar (weekly)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>All premium features</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('pro')} 
                disabled={loading !== null}
                className="w-full mt-4"
                size="sm"
              >
                {loading === 'pro' ? "Loading..." : "Choose Pro"}
              </Button>
            </CardContent>
          </Card>

          {/* Unlimited Plan */}
          <Card className="border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Infinity className="h-3 w-3" />
                Best Value
              </span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Infinity className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-lg text-amber-500">Unlimited</CardTitle>
              </div>
              <div className="text-2xl font-bold">$19.99<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-500 font-medium">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Unlimited everything!</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Unlimited image generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Unlimited room & avatar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>All premium features</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('unlimited')} 
                disabled={loading !== null}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                size="sm"
              >
                {loading === 'unlimited' ? "Loading..." : "Go Unlimited"}
              </Button>
            </CardContent>
          </Card>
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

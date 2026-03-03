import { Crown, ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getTierFromProductId, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
  className?: string;
  feature?: string;
  requiredTier?: "awakening" | "anchoring" | "architect";
  compact?: boolean;
}

export const UpgradeBanner = ({
  className,
  feature,
  requiredTier = "anchoring",
  compact = false,
}: UpgradeBannerProps) => {
  const navigate = useNavigate();
  const { productId, isAdmin, currentTier } = useSubscription();

  // Don't show banner for admins or users who have the required tier
  if (isAdmin) return null;
  
  const tierLevel = {
    awakening: 1,
    anchoring: 2,
    architect: 3,
  };
  
  const userLevel = currentTier === "awakening" ? 1 : currentTier === "anchoring" ? 2 : currentTier === "architect" ? 3 : 0;
  const requiredLevel = tierLevel[requiredTier];
  
  if (userLevel >= requiredLevel) return null;

  // Determine what to show based on user's current tier
  const getUpgradeInfo = () => {
    if (userLevel === 0) {
      // Free user
      return {
        targetTier: requiredTier,
        price: SUBSCRIPTION_TIERS[requiredTier].price,
        label: `Unlock with ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`,
      };
    } else if (userLevel === 1 && requiredLevel >= 2) {
      // Awakening user needing Anchoring or Architect
      return {
        targetTier: requiredTier,
        price: SUBSCRIPTION_TIERS[requiredTier].price,
        label: `Upgrade to ${requiredTier === "architect" ? "Architect" : "Anchoring"}`,
      };
    } else if (userLevel === 2 && requiredLevel === 3) {
      // Anchoring user needing Architect
      return {
        targetTier: "architect" as const,
        price: SUBSCRIPTION_TIERS.architect.price,
        label: "Become an Architect",
      };
    }
    return null;
  };

  const upgradeInfo = getUpgradeInfo();
  if (!upgradeInfo) return null;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20",
        className
      )}>
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {feature ? `${feature} requires ${upgradeInfo.targetTier === "architect" ? "Architect" : "Anchoring"}` : "Upgrade to unlock more features"}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => navigate("/pricing")}
          className="shrink-0"
        >
          {upgradeInfo.label}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  const isArchitect = upgradeInfo.targetTier === "architect";

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isArchitect 
        ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-amber-500/30" 
        : "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className={cn(
            "p-2 rounded-full",
            isArchitect ? "bg-amber-500/20" : "bg-primary/20"
          )}>
            {isArchitect ? (
              <Star className="h-5 w-5 text-amber-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h4 className="font-semibold">
              {feature || "Deepen Your Connection"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isArchitect 
                ? "Architect your reality with unlimited access" 
                : "Anchor deeper with expanded tools for growth"}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/pricing")}
          className={cn(
            "shrink-0",
            isArchitect && "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"
          )}
        >
          {upgradeInfo.label} - ${upgradeInfo.price}/mo
        </Button>
      </div>
    </div>
  );
};

export default UpgradeBanner;

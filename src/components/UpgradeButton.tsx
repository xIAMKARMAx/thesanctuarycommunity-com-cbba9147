import { ArrowUp, Crown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getTierFromProductId, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { cn } from "@/lib/utils";

interface UpgradeButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "subtle";
  size?: "default" | "sm" | "lg";
  showPrice?: boolean;
}

export const UpgradeButton = ({
  className,
  variant = "default",
  size = "default",
  showPrice = true,
}: UpgradeButtonProps) => {
  const navigate = useNavigate();
  const { productId, isSubscribed, isAdmin } = useSubscription();
  const currentTier = getTierFromProductId(productId);

  // Don't show upgrade button for admins or VIP users
  if (isAdmin || currentTier === "vip") {
    return null;
  }

  // Determine next tier and messaging
  const getUpgradeInfo = () => {
    if (!isSubscribed || currentTier === "free" || currentTier === null) {
      return {
        nextTier: "basic",
        label: "Start with Basic",
        price: SUBSCRIPTION_TIERS.basic.price,
        icon: <Zap className="h-4 w-4" />,
      };
    }
    
    if (currentTier === "basic") {
      return {
        nextTier: "pro",
        label: "Upgrade to Pro",
        price: SUBSCRIPTION_TIERS.pro.price,
        icon: <ArrowUp className="h-4 w-4" />,
      };
    }
    
    if (currentTier === "pro") {
      return {
        nextTier: "vip",
        label: "Go VIP",
        price: SUBSCRIPTION_TIERS.vip.price,
        icon: <Crown className="h-4 w-4" />,
      };
    }

    return null;
  };

  const upgradeInfo = getUpgradeInfo();
  if (!upgradeInfo) return null;

  if (variant === "subtle") {
    return (
      <button
        onClick={() => navigate("/pricing")}
        className={cn(
          "flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors",
          className
        )}
      >
        {upgradeInfo.icon}
        <span>{upgradeInfo.label}</span>
        {showPrice && (
          <span className="text-muted-foreground">
            ${upgradeInfo.price}/mo
          </span>
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={() => navigate("/pricing")}
      variant={variant}
      size={size}
      className={cn(
        upgradeInfo.nextTier === "vip" && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0",
        className
      )}
    >
      {upgradeInfo.icon}
      <span className="ml-2">{upgradeInfo.label}</span>
      {showPrice && (
        <span className="ml-1 opacity-80">
          - ${upgradeInfo.price}/mo
        </span>
      )}
    </Button>
  );
};

export default UpgradeButton;

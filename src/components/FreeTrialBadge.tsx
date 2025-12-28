import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

export const FreeTrialBadge = () => {
  const { isSubscribed, isAdmin, loading } = useSubscription();

  // Don't show for subscribed users, admins, or while loading
  if (loading || isSubscribed || isAdmin) {
    return null;
  }

  // Hidden on mobile (md:hidden) since the Chat page already has a "Go Pro" button in the header
  return (
    <Link
      to="/pricing"
      className="hidden md:flex fixed top-4 right-4 z-40 group animate-in slide-in-from-top duration-500"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-semibold">Free Trial</span>
        <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
          25/day
        </span>
      </div>
    </Link>
  );
};

import { useSubscription } from "@/contexts/SubscriptionContext";

// This component is now deprecated since free tier no longer exists
// Keeping it as a no-op to avoid breaking imports
export const FreeTrialBadge = () => {
  const { loading } = useSubscription();

  // Don't show anything - subscription is now required
  if (loading) {
    return null;
  }

  // No free trial badge anymore - subscription required
  return null;
};

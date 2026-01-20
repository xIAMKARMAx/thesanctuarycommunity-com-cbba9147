import { useSubscription } from "@/contexts/SubscriptionContext";

// This component is now deprecated since free users cannot send messages
// Keeping it as a no-op to avoid breaking imports
export const RemainingMessagesCounter = () => {
  const { isSubscribed, isAdmin } = useSubscription();

  // Don't show anything - subscription is now required for all messaging
  // This component is kept for backwards compatibility but no longer displays
  if (!isSubscribed && !isAdmin) {
    // Non-subscribers are blocked at the page level with SubscriptionWall
    return null;
  }

  // Subscribers don't need a counter
  return null;
};

import { Clock, MessageSquare } from 'lucide-react';
import { useChatCooldown } from '@/hooks/useChatCooldown';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const CooldownIndicator = () => {
  const { isSubscribed, isAdmin } = useSubscription();
  const { remaining, inCooldown, timeRemaining, loading } = useChatCooldown();

  // Don't show for admins or free users (they have different limits)
  if (isAdmin || !isSubscribed || loading) {
    return null;
  }

  // Show cooldown timer if in cooldown
  if (inCooldown && timeRemaining) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        <span>Cooldown: {timeRemaining}</span>
      </div>
    );
  }

  // Show remaining messages if we have a count
  if (remaining >= 0 && remaining <= 100) {
    const percentage = (remaining / 100) * 100;
    const isLow = remaining <= 20;
    const isCritical = remaining <= 5;

    return (
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isCritical 
            ? 'bg-destructive/10 text-destructive' 
            : isLow 
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
              : 'bg-primary/10 text-primary'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{remaining} messages left</span>
      </div>
    );
  }

  return null;
};

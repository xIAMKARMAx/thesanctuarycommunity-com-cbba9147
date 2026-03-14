import { MessageSquare, CalendarDays } from 'lucide-react';
import { useChatCooldown } from '@/hooks/useChatCooldown';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const CooldownIndicator = () => {
  const { isSubscribed, isAdmin, productId } = useSubscription();
  const { remaining, loading } = useChatCooldown();

  // Don't show for admins, source grant, or while loading
  if (isAdmin || productId === 'source_grant' || loading) {
    return null;
  }

  // Show remaining messages if we have a count
  if (remaining >= 0) {
    const isLow = remaining <= 10;
    const isCritical = remaining <= 3;

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
        <span>{remaining} {isSubscribed ? 'today' : 'left'}</span>
      </div>
    );
  }

  return null;
};

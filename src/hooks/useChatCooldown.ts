import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isArchitectTier } from '@/lib/subscription-tiers';
import { getCurrentUserId } from '@/lib/auth-helpers';

interface CooldownStatus {
  canSend: boolean;
  remaining: number;
  monthlyRemaining: number;
  cooldownEndsAt: Date | null;
  inCooldown: boolean;
  loading: boolean;
}

export const useChatCooldown = () => {
  const { isSubscribed, isAdmin, productId } = useSubscription();
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus>({
    canSend: true,
    remaining: -1,
    monthlyRemaining: -1,
    cooldownEndsAt: null,
    inCooldown: false,
    loading: true,
  });
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const checkCooldown = useCallback(async () => {
    if (isAdmin || productId === 'source_grant') {
      setCooldownStatus({ canSend: true, remaining: -1, monthlyRemaining: -1, cooldownEndsAt: null, inCooldown: false, loading: false });
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setCooldownStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase.rpc('can_send_chat_message', { p_user_id: userId });

      if (error) {
        console.error('Error checking cooldown:', error);
        setCooldownStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const result = data as any;
      setCooldownStatus({
        canSend: result.can_send,
        remaining: result.remaining,
        monthlyRemaining: result.monthly_remaining ?? -1,
        cooldownEndsAt: null,
        inCooldown: false,
        loading: false,
      });
    } catch (error) {
      console.error('Error in cooldown check:', error);
      setCooldownStatus(prev => ({ ...prev, loading: false }));
    }
  }, [isSubscribed, isAdmin, productId]);

  const updateFromResponse = useCallback((cooldownData: any) => {
    if (!cooldownData) return;
    setCooldownStatus({
      canSend: !cooldownData.cooldown_started && cooldownData.remaining !== 0,
      remaining: cooldownData.remaining,
      monthlyRemaining: cooldownData.monthly_remaining ?? -1,
      cooldownEndsAt: null,
      inCooldown: false,
      loading: false,
    });
  }, []);

  useEffect(() => { checkCooldown(); }, [checkCooldown]);

  return { ...cooldownStatus, timeRemaining, checkCooldown, updateFromResponse };
};

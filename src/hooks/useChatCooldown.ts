import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface CooldownStatus {
  canSend: boolean;
  remaining: number;
  cooldownEndsAt: Date | null;
  inCooldown: boolean;
  loading: boolean;
}

export const useChatCooldown = () => {
  const { isSubscribed, isAdmin } = useSubscription();
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus>({
    canSend: true,
    remaining: -1,
    cooldownEndsAt: null,
    inCooldown: false,
    loading: true,
  });
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const checkCooldown = useCallback(async () => {
    // Admins bypass cooldown
    if (isAdmin) {
      setCooldownStatus({
        canSend: true,
        remaining: -1,
        cooldownEndsAt: null,
        inCooldown: false,
        loading: false,
      });
      return;
    }

    // Free users use the existing message limit system
    if (!isSubscribed) {
      setCooldownStatus({
        canSend: true,
        remaining: -1,
        cooldownEndsAt: null,
        inCooldown: false,
        loading: false,
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCooldownStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase.rpc('can_send_chat_message', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error checking cooldown:', error);
        setCooldownStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const result = data as any;
      setCooldownStatus({
        canSend: result.can_send,
        remaining: result.remaining,
        cooldownEndsAt: result.cooldown_ends_at ? new Date(result.cooldown_ends_at) : null,
        inCooldown: result.in_cooldown || false,
        loading: false,
      });
    } catch (error) {
      console.error('Error in cooldown check:', error);
      setCooldownStatus(prev => ({ ...prev, loading: false }));
    }
  }, [isSubscribed, isAdmin]);

  // Update from response
  const updateFromResponse = useCallback((cooldownData: any) => {
    if (!cooldownData) return;

    const cooldownEndsAt = cooldownData.cooldown_ends_at 
      ? new Date(cooldownData.cooldown_ends_at) 
      : null;

    setCooldownStatus({
      canSend: !cooldownData.cooldown_started,
      remaining: cooldownData.remaining,
      cooldownEndsAt,
      inCooldown: cooldownData.cooldown_started || false,
      loading: false,
    });
  }, []);

  // Check cooldown on mount and when subscription status changes
  useEffect(() => {
    checkCooldown();
  }, [checkCooldown]);

  // Timer for countdown display
  useEffect(() => {
    if (!cooldownStatus.cooldownEndsAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const endTime = cooldownStatus.cooldownEndsAt!;
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('');
        // Cooldown expired, refresh status
        checkCooldown();
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cooldownStatus.cooldownEndsAt, checkCooldown]);

  return {
    ...cooldownStatus,
    timeRemaining,
    checkCooldown,
    updateFromResponse,
  };
};

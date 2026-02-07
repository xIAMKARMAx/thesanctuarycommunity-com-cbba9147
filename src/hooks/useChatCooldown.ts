import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from '@/hooks/use-toast';
import { isArchitectTier } from '@/lib/subscription-tiers';

interface CooldownStatus {
  canSend: boolean;
  remaining: number;
  cooldownEndsAt: Date | null;
  inCooldown: boolean;
  loading: boolean;
}

export const useChatCooldown = () => {
  const { isSubscribed, isAdmin, productId } = useSubscription();
  const isArchitect = isArchitectTier(productId);
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus>({
    canSend: true,
    remaining: -1,
    cooldownEndsAt: null,
    inCooldown: false,
    loading: true,
  });
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Track if we were previously in cooldown to detect when it ends
  const wasInCooldown = useRef<boolean>(false);

  const checkCooldown = useCallback(async () => {
    // Admins and Architect tier bypass cooldown entirely
    if (isAdmin || isArchitect) {
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
  }, [isSubscribed, isAdmin, isArchitect]);

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

    // Track that we're in cooldown
    wasInCooldown.current = true;

    const updateTimer = () => {
      const now = new Date();
      const endTime = cooldownStatus.cooldownEndsAt!;
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('');
        
        // Cooldown just expired - show notification if we were previously in cooldown
        if (wasInCooldown.current) {
          wasInCooldown.current = false;
          toast({
            title: "Cooldown Period Over! 🎉",
            description: "Cool down period over back to chatting",
            duration: 8000, // Show for 8 seconds
          });
        }
        
        // Cooldown expired, refresh status
        checkCooldown();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Format: show hours if > 0, otherwise just MM:SS
      if (hours > 0) {
        setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
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

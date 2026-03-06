import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GenerationCooldown {
  isAdmin: boolean;
  isSubscribed: boolean;
  cooldownDays: number;
  avatarCanGenerate: boolean;
  roomCanGenerate: boolean;
  petCanGenerate: boolean;
  avatarAvailableAt: string | null;
  roomAvailableAt: string | null;
  petAvailableAt: string | null;
  avatarGeneratedAt: string | null;
  roomGeneratedAt: string | null;
  petGeneratedAt: string | null;
}

export const useGenerationCooldown = () => {
  const [cooldown, setCooldown] = useState<GenerationCooldown | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCooldown = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_generation_cooldown', {
        p_user_id: session.user.id
      });

      if (error) throw error;

      // Cast data to the expected shape
      const result = data as {
        is_admin: boolean;
        is_subscribed: boolean;
        cooldown_days: number;
        avatar_can_generate: boolean;
        room_can_generate: boolean;
        pet_can_generate: boolean;
        avatar_available_at: string | null;
        room_available_at: string | null;
        pet_available_at: string | null;
        avatar_generated_at: string | null;
        room_generated_at: string | null;
        pet_generated_at: string | null;
      };

      setCooldown({
        isAdmin: result.is_admin,
        isSubscribed: result.is_subscribed,
        cooldownDays: result.cooldown_days,
        avatarCanGenerate: result.avatar_can_generate,
        roomCanGenerate: result.room_can_generate,
        petCanGenerate: result.pet_can_generate,
        avatarAvailableAt: result.avatar_available_at,
        roomAvailableAt: result.room_available_at,
        petAvailableAt: result.pet_available_at,
        avatarGeneratedAt: result.avatar_generated_at,
        roomGeneratedAt: result.room_generated_at,
        petGeneratedAt: result.pet_generated_at,
      });
    } catch (error) {
      console.error('Error fetching generation cooldown:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCooldown();
  }, [fetchCooldown]);

  const formatTimeRemaining = (availableAt: string | null): string | null => {
    if (!availableAt) return null;
    
    const available = new Date(availableAt);
    const now = new Date();
    
    if (available <= now) return null;
    
    const diffMs = available.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  return {
    cooldown,
    loading,
    refresh: fetchCooldown,
    formatTimeRemaining,
    getAvatarTimeRemaining: () => formatTimeRemaining(cooldown?.avatarAvailableAt || null),
    getRoomTimeRemaining: () => formatTimeRemaining(cooldown?.roomAvailableAt || null),
    getPetTimeRemaining: () => formatTimeRemaining(cooldown?.petAvailableAt || null),
  };
};

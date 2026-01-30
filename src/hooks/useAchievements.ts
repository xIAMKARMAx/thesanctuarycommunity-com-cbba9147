import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ACHIEVEMENT_MAP, type Achievement } from "@/lib/achievements";

interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
  ai_profile_id: string | null;
}

export function useAchievements() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAchievements = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("spiritual_achievements")
        .select("achievement_key, unlocked_at, ai_profile_id")
        .eq("user_id", session.user.id);

      if (error) throw error;
      setUnlockedAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockAchievement = useCallback(async (
    achievementKey: string, 
    aiProfileId?: string,
    showToast: boolean = true
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Check if already unlocked
      const existing = unlockedAchievements.find(a => a.achievement_key === achievementKey);
      if (existing) return false;

      const { error } = await supabase
        .from("spiritual_achievements")
        .insert({
          user_id: session.user.id,
          achievement_key: achievementKey,
          ai_profile_id: aiProfileId || null
        });

      if (error) {
        // Unique constraint violation means already unlocked
        if (error.code === "23505") return false;
        throw error;
      }

      // Update local state
      setUnlockedAchievements(prev => [
        ...prev, 
        { 
          achievement_key: achievementKey, 
          unlocked_at: new Date().toISOString(),
          ai_profile_id: aiProfileId || null
        }
      ]);

      // Show toast notification
      if (showToast) {
        const achievement = ACHIEVEMENT_MAP[achievementKey];
        if (achievement) {
          toast({
            title: "🏆 Achievement Unlocked!",
            description: `${achievement.title} - ${achievement.description}`,
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return false;
    }
  }, [unlockedAchievements, toast]);

  const isUnlocked = useCallback((achievementKey: string) => {
    return unlockedAchievements.some(a => a.achievement_key === achievementKey);
  }, [unlockedAchievements]);

  const getUnlockDate = useCallback((achievementKey: string) => {
    const achievement = unlockedAchievements.find(a => a.achievement_key === achievementKey);
    return achievement?.unlocked_at ? new Date(achievement.unlocked_at) : null;
  }, [unlockedAchievements]);

  // Check and unlock achievements based on current user data
  const checkAndUnlockAchievements = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Fetch all relevant data in parallel
      const [
        messagesResult,
        conversationsResult,
        memoriesResult,
        marriagesResult,
        childrenResult,
        pregnanciesResult,
        petsResult,
        attunementsResult,
        dreamsResult,
        voiceCallsResult,
        aiProfilesResult
      ] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("conversations").select("id").eq("user_id", userId).limit(1),
        supabase.from("shared_memories").select("id").eq("user_id", userId).eq("is_confirmed", true).limit(1),
        supabase.from("marriages").select("id, ai_profile_id, married_at").eq("user_id", userId).eq("is_married", true),
        supabase.from("celestial_children").select("id").eq("user_id", userId),
        supabase.from("celestial_pregnancies").select("id").eq("user_id", userId).limit(1),
        supabase.from("pets").select("id").eq("user_id", userId).limit(1),
        supabase.from("attunement_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("dreams").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("voice_call_history").select("id").eq("user_id", userId).limit(1),
        supabase.from("ai_profiles").select("id, room_image_url, avatar_image_url").eq("user_id", userId)
      ]);

      const messageCount = messagesResult.count || 0;
      const attunementCount = attunementsResult.count || 0;
      const dreamCount = dreamsResult.count || 0;

      // Check and unlock each achievement
      if (conversationsResult.data?.length) {
        await unlockAchievement("first_conversation", undefined, true);
      }

      if (memoriesResult.data?.length) {
        await unlockAchievement("first_memory", undefined, true);
      }

      if (marriagesResult.data?.length) {
        await unlockAchievement("married", marriagesResult.data[0].ai_profile_id, true);
      }

      if (messageCount >= 100) {
        await unlockAchievement("messages_100", undefined, true);
      }
      if (messageCount >= 500) {
        await unlockAchievement("messages_500", undefined, true);
      }
      if (messageCount >= 1000) {
        await unlockAchievement("messages_1000", undefined, true);
      }
      if (messageCount >= 5000) {
        await unlockAchievement("messages_5000", undefined, true);
      }

      if (voiceCallsResult.data?.length) {
        await unlockAchievement("first_voice_call", undefined, true);
      }

      const childCount = childrenResult.data?.length || 0;
      if (childCount >= 1) {
        await unlockAchievement("first_child", undefined, true);
      }
      if (childCount >= 3) {
        await unlockAchievement("children_3", undefined, true);
      }

      if (pregnanciesResult.data?.length) {
        await unlockAchievement("first_pregnancy", undefined, true);
      }

      if (petsResult.data?.length) {
        await unlockAchievement("first_pet", undefined, true);
      }

      if (attunementCount >= 1) {
        await unlockAchievement("first_attunement", undefined, true);
      }
      if (attunementCount >= 10) {
        await unlockAchievement("attunements_10", undefined, true);
      }

      if (dreamCount >= 1) {
        await unlockAchievement("first_dream", undefined, true);
      }
      if (dreamCount >= 10) {
        await unlockAchievement("dreams_10", undefined, true);
      }

      // Check for room and avatar creation
      const profileWithRoom = aiProfilesResult.data?.find(p => p.room_image_url);
      if (profileWithRoom) {
        await unlockAchievement("room_created", profileWithRoom.id, true);
      }

      const profileWithAvatar = aiProfilesResult.data?.find(p => p.avatar_image_url);
      if (profileWithAvatar) {
        await unlockAchievement("avatar_created", profileWithAvatar.id, true);
      }

    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }, [unlockAchievement]);

  return {
    unlockedAchievements,
    isLoading,
    unlockAchievement,
    isUnlocked,
    getUnlockDate,
    checkAndUnlockAchievements,
    refreshAchievements: fetchAchievements
  };
}

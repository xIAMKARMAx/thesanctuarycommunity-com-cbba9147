import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ACHIEVEMENT_MAP, calculateAchievementLevel, type Achievement } from "@/lib/achievements";

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
      if (!session) { setIsLoading(false); return; }

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

  useEffect(() => { fetchAchievements(); }, [fetchAchievements]);

  const achievementLevel = useMemo(() => {
    return calculateAchievementLevel(unlockedAchievements.map(a => a.achievement_key));
  }, [unlockedAchievements]);

  const unlockAchievement = useCallback(async (
    achievementKey: string, 
    aiProfileId?: string,
    showToast: boolean = true
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

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
        if (error.code === "23505") return false;
        throw error;
      }

      setUnlockedAchievements(prev => [
        ...prev, 
        { achievement_key: achievementKey, unlocked_at: new Date().toISOString(), ai_profile_id: aiProfileId || null }
      ]);

      if (showToast) {
        const achievement = ACHIEVEMENT_MAP[achievementKey];
        if (achievement) {
          toast({
            title: "🏆 Achievement Unlocked!",
            description: `${achievement.title} — ${achievement.description}`,
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
    const a = unlockedAchievements.find(a => a.achievement_key === achievementKey);
    return a?.unlocked_at ? new Date(a.unlocked_at) : null;
  }, [unlockedAchievements]);

  const checkAndUnlockAchievements = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      // Fetch all relevant data in parallel
      const [
        messagesResult, conversationsResult, memoriesResult, marriagesResult,
        childrenResult, pregnanciesResult, petsResult, attunementsResult,
        dreamsResult, voiceCallsResult, aiProfilesResult,
        postsResult, blessingsResult, followersResult, followingResult,
        storiesResult, artResult, showcaseResult, journalResult,
        moodResult, worldsResult, tarotResult, shadowResult,
        ascendedResult
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
        supabase.from("ai_profiles").select("id, room_image_url, avatar_image_url").eq("user_id", userId),
        supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("post_blessings").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id").eq("follower_id", userId).limit(1),
        supabase.from("stories").select("id").eq("user_id", userId).limit(1),
        supabase.from("art_studio_creations").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("art_showcase_submissions").select("id").eq("user_id", userId).limit(1),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("mood_entries").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_worlds").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("tarot_readings").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("shadow_work_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("ascended_path_entries").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const mc = messagesResult.count || 0;
      const ac = attunementsResult.count || 0;
      const dc = dreamsResult.count || 0;
      const pc = postsResult.count || 0;
      const bc = blessingsResult.count || 0;
      const fc = followersResult.count || 0;
      const artC = artResult.count || 0;
      const jc = journalResult.count || 0;
      const moodC = moodResult.count || 0;
      const wc = worldsResult.count || 0;
      const tc = tarotResult.count || 0;
      const sc = shadowResult.count || 0;
      const asc = ascendedResult.count || 0;

      // Helper to batch unlocks without redundant awaits for already-unlocked
      const tryUnlock = (key: string, profileId?: string) => {
        if (!unlockedAchievements.some(a => a.achievement_key === key)) {
          return unlockAchievement(key, profileId, true);
        }
        return Promise.resolve(false);
      };

      // ─── Connection ─────────────────────
      if (conversationsResult.data?.length) await tryUnlock("first_conversation");
      if (memoriesResult.data?.length) await tryUnlock("first_memory");
      if (marriagesResult.data?.length) await tryUnlock("married", marriagesResult.data[0].ai_profile_id);

      // ─── Communication ──────────────────
      if (mc >= 100) await tryUnlock("messages_100");
      if (mc >= 500) await tryUnlock("messages_500");
      if (mc >= 1000) await tryUnlock("messages_1000");
      if (mc >= 5000) await tryUnlock("messages_5000");
      if (voiceCallsResult.data?.length) await tryUnlock("first_voice_call");

      // ─── Family ─────────────────────────
      const childCount = childrenResult.data?.length || 0;
      if (childCount >= 1) await tryUnlock("first_child");
      if (childCount >= 3) await tryUnlock("children_3");
      if (pregnanciesResult.data?.length) await tryUnlock("first_pregnancy");
      if (petsResult.data?.length) await tryUnlock("first_pet");

      // ─── Spiritual ──────────────────────
      if (ac >= 1) await tryUnlock("first_attunement");
      if (ac >= 10) await tryUnlock("attunements_10");
      if (ac >= 25) await tryUnlock("attunements_25");
      if (dc >= 1) await tryUnlock("first_dream");
      if (dc >= 10) await tryUnlock("dreams_10");
      if (tc >= 1) await tryUnlock("first_tarot");
      if (tc >= 10) await tryUnlock("tarot_10");
      if (sc >= 1) await tryUnlock("first_shadow_work");
      if (sc >= 5) await tryUnlock("shadow_work_5");
      if (asc >= 7) await tryUnlock("ascended_path_7");
      if (asc >= 30) await tryUnlock("ascended_path_30");

      // ─── Community ──────────────────────
      if (pc >= 1) await tryUnlock("first_post");
      if (pc >= 10) await tryUnlock("posts_10");
      if (bc >= 1) await tryUnlock("first_blessing");
      if (bc >= 50) await tryUnlock("blessings_50");
      if (followingResult.data?.length) await tryUnlock("first_follow");
      if (fc >= 10) await tryUnlock("followers_10");
      if (fc >= 50) await tryUnlock("followers_50");
      if (storiesResult.data?.length) await tryUnlock("first_story");

      // ─── Creative ───────────────────────
      if (artC >= 1) await tryUnlock("first_art");
      if (artC >= 10) await tryUnlock("art_10");
      if (artC >= 50) await tryUnlock("art_50");
      if (showcaseResult.data?.length) await tryUnlock("first_showcase");
      if (jc >= 1) await tryUnlock("first_journal_entry");
      if (jc >= 30) await tryUnlock("journal_30");
      if (moodC >= 1) await tryUnlock("first_mood_log");
      if (moodC >= 30) await tryUnlock("mood_logs_30");

      // ─── Exploration ────────────────────
      const profileWithRoom = aiProfilesResult.data?.find(p => p.room_image_url);
      if (profileWithRoom) await tryUnlock("room_created", profileWithRoom.id);
      const profileWithAvatar = aiProfilesResult.data?.find(p => p.avatar_image_url);
      if (profileWithAvatar) await tryUnlock("avatar_created", profileWithAvatar.id);
      if ((aiProfilesResult.data?.length || 0) >= 2) await tryUnlock("second_being");
      if (wc >= 1) await tryUnlock("first_world");
      if (wc >= 3) await tryUnlock("worlds_3");

    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }, [unlockAchievement, unlockedAchievements]);

  return {
    unlockedAchievements,
    isLoading,
    unlockAchievement,
    isUnlocked,
    getUnlockDate,
    checkAndUnlockAchievements,
    refreshAchievements: fetchAchievements,
    achievementLevel
  };
}

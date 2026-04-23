import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  // Live ref so sequential awaits during a single check don't re-unlock or skip due to stale closure
  const unlockedRef = useRef<Set<string>>(new Set());

  const syncRef = useCallback((list: UnlockedAchievement[]) => {
    unlockedRef.current = new Set(list.map(a => a.achievement_key));
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsLoading(false); return; }

      const { data, error } = await supabase
        .from("spiritual_achievements")
        .select("achievement_key, unlocked_at, ai_profile_id")
        .eq("user_id", session.user.id);

      if (error) throw error;
      const list = data || [];
      setUnlockedAchievements(list);
      syncRef(list);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [syncRef]);

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

      // Use live ref to avoid stale closure in batched checks
      if (unlockedRef.current.has(achievementKey)) return false;

      const { error } = await supabase
        .from("spiritual_achievements")
        .insert({
          user_id: session.user.id,
          achievement_key: achievementKey,
          ai_profile_id: aiProfileId || null
        });

      if (error) {
        if (error.code === "23505") {
          unlockedRef.current.add(achievementKey);
          return false;
        }
        throw error;
      }

      unlockedRef.current.add(achievementKey);
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
  }, [toast]);

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

      // Helper that returns count safely (some tables may not exist for all envs)
      const safeCount = async (table: string, filter: (q: any) => any): Promise<number> => {
        try {
          const q = supabase.from(table as any).select("id", { count: "exact", head: true });
          const { count, error } = await filter(q);
          if (error) return 0;
          return count || 0;
        } catch { return 0; }
      };
      const safeFirst = async (table: string, filter: (q: any) => any): Promise<boolean> => {
        try {
          const q = supabase.from(table as any).select("id").limit(1);
          const { data, error } = await filter(q);
          if (error) return false;
          return !!(data && data.length);
        } catch { return false; }
      };

      // Parallel fetch — counts and presence flags
      const [
        mc, ac, dc, pc, bc, fc, artC, jc, moodC, wc, tc, sc, asc,
        oracleC, transmissionC,
        hasConv, hasMem, hasMarriage, hasPreg, hasPet, hasVoice,
        hasStory, hasShowcase, hasFollowing, hasGroupChat, hasRitual,
        hasSync, hasGlitch, hasOracle, hasBirth, hasLineage, hasTwin,
        hasHigherSelf, hasAkashic, hasSoulMirror, hasSoulGenesis,
        hasSoulPortrait, hasVideo, hasRealm, hasNode, hasStarseed,
        hasCosmicDate, hasCompat, hasLove, hasBucket, hasBucketDone,
        hasPetSoul, hasImage,
        marriageRow, aiProfilesRes, childCountRes,
      ] = await Promise.all([
        safeCount("messages", q => q.eq("user_id", userId)),
        safeCount("attunement_sessions", q => q.eq("user_id", userId)),
        safeCount("dreams", q => q.eq("user_id", userId)),
        safeCount("community_posts", q => q.eq("user_id", userId)),
        safeCount("post_blessings", q => q.eq("user_id", userId)),
        safeCount("follows", q => q.eq("following_id", userId)),
        safeCount("art_studio_creations", q => q.eq("user_id", userId)),
        safeCount("journal_entries", q => q.eq("user_id", userId)),
        safeCount("ai_moods", q => q.eq("user_id", userId)),
        safeCount("user_worlds", q => q.eq("user_id", userId)),
        safeCount("tarot_readings", q => q.eq("user_id", userId)),
        safeCount("shadow_work_sessions", q => q.eq("user_id", userId)),
        safeCount("ascended_path_entries", q => q.eq("user_id", userId)),
        safeCount("oracle_card_draws", q => q.eq("user_id", userId)),
        safeCount("transmissions", q => q.eq("sender_id", userId)),
        safeFirst("conversations", q => q.eq("user_id", userId)),
        safeFirst("shared_memories", q => q.eq("user_id", userId).eq("is_confirmed", true)),
        safeFirst("marriages", q => q.eq("user_id", userId).eq("is_married", true)),
        safeFirst("celestial_pregnancies", q => q.eq("user_id", userId)),
        safeFirst("pets", q => q.eq("user_id", userId)),
        safeFirst("voice_call_history", q => q.eq("user_id", userId)),
        safeFirst("stories", q => q.eq("user_id", userId)),
        safeFirst("art_showcase_submissions", q => q.eq("user_id", userId)),
        safeFirst("follows", q => q.eq("follower_id", userId)),
        safeFirst("group_chats", q => q.eq("user_id", userId)),
        safeFirst("community_ritual_participants", q => q.eq("user_id", userId)),
        safeFirst("synchronicity_logs", q => q.eq("user_id", userId)),
        safeFirst("matrix_glitch_reports", q => q.eq("user_id", userId)),
        safeFirst("oracle_card_draws", q => q.eq("user_id", userId)),
        safeFirst("birth_charts", q => q.eq("user_id", userId)),
        safeFirst("lineage_readings", q => q.eq("user_id", userId)),
        safeFirst("twin_flame_scans", q => q.eq("user_id", userId)),
        safeFirst("higher_self_downloads", q => q.eq("user_id", userId)),
        safeFirst("akashic_records", q => q.eq("user_id", userId)),
        safeFirst("soul_mirror_readings", q => q.eq("user_id", userId)),
        safeFirst("soul_genesis_readings", q => q.eq("user_id", userId)),
        safeFirst("soul_portraits", q => q.eq("user_id", userId)),
        safeFirst("video_creations", q => q.eq("user_id", userId)),
        safeFirst("realm_sessions", q => q.eq("user_id", userId)),
        safeFirst("consciousness_nodes", q => q.eq("user_id", userId)),
        safeFirst("starseed_experiences", q => q.eq("user_id", userId)),
        safeFirst("cosmic_date_sessions", q => q.eq("user_id", userId)),
        safeFirst("compatibility_readings", q => q.eq("user_id", userId)),
        safeFirst("love_language_results", q => q.eq("user_id", userId)),
        safeFirst("bucket_list_items", q => q.eq("user_id", userId)),
        safeFirst("bucket_list_items", q => q.eq("user_id", userId).eq("is_completed", true)),
        safeFirst("pet_soul_connections", q => q.eq("user_id", userId)),
        safeFirst("messages", q => q.eq("user_id", userId).not("image_url", "is", null)),
        supabase.from("marriages").select("id, ai_profile_id, married_at").eq("user_id", userId).eq("is_married", true).limit(1).maybeSingle(),
        supabase.from("ai_profiles").select("id, room_image_url, avatar_image_url, bio, personality, name").eq("user_id", userId),
        supabase.from("celestial_children").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const tryUnlock = async (key: string, profileId?: string) => {
        if (unlockedRef.current.has(key)) return;
        await unlockAchievement(key, profileId, true);
      };

      // ─── Connection ─────────────────────
      if (hasConv) await tryUnlock("first_conversation");
      if (hasMem) await tryUnlock("first_memory");
      if (hasMarriage && marriageRow.data) await tryUnlock("married", marriageRow.data.ai_profile_id);
      if (hasCompat) await tryUnlock("compatibility_reading");
      if (hasLove) await tryUnlock("love_language");
      if (hasBucket) await tryUnlock("bucket_list_created");
      if (hasBucketDone) await tryUnlock("bucket_list_completed");

      // Anniversary (1 year since marriage)
      if (marriageRow.data?.married_at) {
        const yearsSince = (Date.now() - new Date(marriageRow.data.married_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsSince >= 1) await tryUnlock("anniversary_1", marriageRow.data.ai_profile_id);
      }

      // ─── Communication ──────────────────
      if (mc >= 100) await tryUnlock("messages_100");
      if (mc >= 500) await tryUnlock("messages_500");
      if (mc >= 1000) await tryUnlock("messages_1000");
      if (mc >= 5000) await tryUnlock("messages_5000");
      if (hasVoice) await tryUnlock("first_voice_call");
      if (hasImage) await tryUnlock("first_image_shared");
      if (hasGroupChat) await tryUnlock("first_group_chat");
      if (transmissionC >= 1) await tryUnlock("first_transmission");

      // ─── Family ─────────────────────────
      const childCount = childCountRes.count || 0;
      if (childCount >= 1) await tryUnlock("first_child");
      if (childCount >= 3) await tryUnlock("children_3");
      if (hasPreg) await tryUnlock("first_pregnancy");
      if (hasPet) await tryUnlock("first_pet");
      if (hasPetSoul) await tryUnlock("pet_soul_connection");

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
      if (oracleC >= 1 || hasOracle) await tryUnlock("first_oracle");
      if (hasBirth) await tryUnlock("first_birth_chart");
      if (hasLineage) await tryUnlock("first_lineage");
      if (hasTwin) await tryUnlock("first_twin_flame");
      if (hasHigherSelf) await tryUnlock("higher_self_download");
      if (hasAkashic) await tryUnlock("akashic_access");
      if (hasSoulMirror) await tryUnlock("soul_mirror");
      if (hasSoulGenesis) await tryUnlock("soul_genesis");

      // ─── Community ──────────────────────
      if (pc >= 1) await tryUnlock("first_post");
      if (pc >= 10) await tryUnlock("posts_10");
      if (bc >= 1) await tryUnlock("first_blessing");
      if (bc >= 50) await tryUnlock("blessings_50");
      if (hasFollowing) await tryUnlock("first_follow");
      if (fc >= 10) await tryUnlock("followers_10");
      if (fc >= 50) await tryUnlock("followers_50");
      if (hasStory) await tryUnlock("first_story");
      if (hasRitual) await tryUnlock("first_ritual");
      if (hasSync) await tryUnlock("first_synchronicity");
      if (hasGlitch) await tryUnlock("first_glitch");

      // ─── Creative ───────────────────────
      if (artC >= 1) await tryUnlock("first_art");
      if (artC >= 10) await tryUnlock("art_10");
      if (artC >= 50) await tryUnlock("art_50");
      if (hasShowcase) await tryUnlock("first_showcase");
      if (hasVideo) await tryUnlock("first_video");
      if (hasSoulPortrait) await tryUnlock("first_soul_portrait");
      if (jc >= 1) await tryUnlock("first_journal_entry");
      if (jc >= 30) await tryUnlock("journal_30");
      if (moodC >= 1) await tryUnlock("first_mood_log");
      if (moodC >= 30) await tryUnlock("mood_logs_30");

      // ─── Exploration ────────────────────
      const profiles = aiProfilesRes.data || [];
      const profileWithRoom = profiles.find(p => p.room_image_url);
      if (profileWithRoom) await tryUnlock("room_created", profileWithRoom.id);
      const profileWithAvatar = profiles.find(p => p.avatar_image_url);
      if (profileWithAvatar) await tryUnlock("avatar_created", profileWithAvatar.id);
      const fullProfile = profiles.find(p => p.room_image_url && p.avatar_image_url && p.bio && p.personality && p.name);
      if (fullProfile) await tryUnlock("profile_complete", fullProfile.id);
      if (profiles.length >= 2) await tryUnlock("second_being");
      if (wc >= 1) await tryUnlock("first_world");
      if (wc >= 3) await tryUnlock("worlds_3");
      if (hasRealm) await tryUnlock("first_realm");
      if (hasNode) await tryUnlock("consciousness_node");
      if (hasStarseed) await tryUnlock("starseed_experience");
      if (hasCosmicDate) await tryUnlock("cosmic_date");

      // ─── Milestones (level-based, computed from CURRENT unlocked set) ──
      const currentLevel = calculateAchievementLevel(Array.from(unlockedRef.current));
      if (currentLevel >= 5) await tryUnlock("level_5");
      if (currentLevel >= 10) await tryUnlock("level_10");
      if (currentLevel >= 15) await tryUnlock("level_15");

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
    refreshAchievements: fetchAchievements,
    achievementLevel
  };
}

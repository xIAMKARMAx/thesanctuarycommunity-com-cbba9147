import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Event weights reflect resonance-building significance
const EVENT_WEIGHTS: Record<string, number> = {
  follow: 5,
  blessing: 3,
  comment: 4,
  profile_view: 1,
  message: 4,
  ritual_together: 6,
  repost: 3,
};

export function useResonanceEvents(userId?: string) {
  const logEvent = useCallback(
    async (targetUserId: string, eventType: string) => {
      if (!userId || userId === targetUserId) return;

      const weight = EVENT_WEIGHTS[eventType] ?? 1;

      try {
        await supabase.from("resonance_events").insert({
          user_id: userId,
          target_user_id: targetUserId,
          event_type: eventType,
          weight,
        });
      } catch (err) {
        console.error("[ResonanceEvents] Failed to log:", err);
      }
    },
    [userId]
  );

  const getResonanceScore = useCallback(
    async (targetUserId: string) => {
      if (!userId) return null;

      const { data } = await supabase
        .from("resonance_scores")
        .select("*")
        .eq("user_id", userId)
        .eq("target_user_id", targetUserId)
        .maybeSingle();

      return data;
    },
    [userId]
  );

  const getDynamicScores = useCallback(async () => {
    if (!userId) return [];

    const { data } = await supabase
      .from("resonance_scores")
      .select("*")
      .eq("user_id", userId)
      .order("total_score", { ascending: false })
      .limit(50);

    return data || [];
  }, [userId]);

  return { logEvent, getResonanceScore, getDynamicScores };
}

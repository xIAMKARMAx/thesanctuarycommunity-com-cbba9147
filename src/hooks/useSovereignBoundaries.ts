import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SovereignBoundary {
  id: string;
  user_id: string;
  min_resonance_threshold: number;
  block_unmatched: boolean;
  allow_transmissions_from: string;
  energy_filter_tags: string[];
  boundary_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSovereignBoundaries(userId?: string) {
  const [boundary, setBoundary] = useState<SovereignBoundary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBoundary = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from("sovereign_boundaries")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setBoundary(data as SovereignBoundary | null);
    } catch (err) {
      console.error("[SovereignBoundaries] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchBoundary(); }, [fetchBoundary]);

  const saveBoundary = useCallback(async (updates: Partial<SovereignBoundary>) => {
    if (!userId) return;
    const payload = { ...updates, user_id: userId, updated_at: new Date().toISOString() };
    
    if (boundary) {
      await supabase
        .from("sovereign_boundaries")
        .update(payload)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("sovereign_boundaries")
        .insert(payload);
    }
    await fetchBoundary();
  }, [userId, boundary, fetchBoundary]);

  const checkAccess = useCallback(async (visitorUserId: string): Promise<{ allowed: boolean; message?: string }> => {
    if (!boundary || !boundary.is_active) return { allowed: true };
    if (boundary.min_resonance_threshold <= 0 && !boundary.block_unmatched) return { allowed: true };

    // Check resonance score between visitor and this user
    const { data: score } = await supabase
      .from("resonance_scores")
      .select("total_score")
      .or(`and(user_id.eq.${visitorUserId},target_user_id.eq.${userId}),and(user_id.eq.${userId},target_user_id.eq.${visitorUserId})`)
      .order("total_score", { ascending: false })
      .limit(1)
      .maybeSingle();

    const totalScore = Number(score?.total_score) || 0;

    if (boundary.block_unmatched && totalScore === 0) {
      return { allowed: false, message: boundary.boundary_message };
    }

    if (totalScore < boundary.min_resonance_threshold) {
      return { allowed: false, message: boundary.boundary_message };
    }

    return { allowed: true };
  }, [boundary, userId]);

  return { boundary, loading, saveBoundary, checkAccess, refetch: fetchBoundary };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CollectiveWisdomEntry {
  id: string;
  insight_text: string;
  source_post_ids: string[];
  theme_tags: string[];
  resonance_count: number;
  synthesis_date: string;
  is_active: boolean;
  created_at: string;
}

export function useCollectiveWisdom() {
  const [wisdom, setWisdom] = useState<CollectiveWisdomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id || null);
    });
  }, []);

  const fetchWisdom = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("collective_wisdom")
        .select("*")
        .eq("is_active", true)
        .order("synthesis_date", { ascending: false })
        .limit(10);

      setWisdom((data || []) as CollectiveWisdomEntry[]);

      // Fetch user's acknowledgments
      if (userId) {
        const { data: acks } = await supabase
          .from("wisdom_acknowledgments")
          .select("wisdom_id")
          .eq("user_id", userId);
        setAcknowledged(new Set((acks || []).map(a => a.wisdom_id)));
      }
    } catch (err) {
      console.error("[CollectiveWisdom] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchWisdom(); }, [fetchWisdom]);

  const acknowledgeWisdom = useCallback(async (wisdomId: string) => {
    if (!userId) return;
    if (acknowledged.has(wisdomId)) {
      // Remove acknowledgment
      await supabase
        .from("wisdom_acknowledgments")
        .delete()
        .eq("wisdom_id", wisdomId)
        .eq("user_id", userId);
      setAcknowledged(prev => { const next = new Set(prev); next.delete(wisdomId); return next; });
    } else {
      await supabase
        .from("wisdom_acknowledgments")
        .insert({ wisdom_id: wisdomId, user_id: userId });
      setAcknowledged(prev => new Set(prev).add(wisdomId));
    }
    // Update resonance count
    await fetchWisdom();
  }, [userId, acknowledged, fetchWisdom]);

  return { wisdom, loading, acknowledged, acknowledgeWisdom, refetch: fetchWisdom };
}

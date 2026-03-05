import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Cache legend user IDs to avoid repeated queries
let cachedLegendIds: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function usePrometheanLegends() {
  const [legendIds, setLegendIds] = useState<Set<string>>(cachedLegendIds || new Set());
  const [loaded, setLoaded] = useState(!!cachedLegendIds);

  useEffect(() => {
    if (cachedLegendIds && Date.now() - cacheTimestamp < CACHE_TTL) {
      setLegendIds(cachedLegendIds);
      setLoaded(true);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("promethean_legends")
        .select("user_id")
        .eq("is_active", true);

      const ids = new Set((data || []).map(d => d.user_id));
      cachedLegendIds = ids;
      cacheTimestamp = Date.now();
      setLegendIds(ids);
      setLoaded(true);
    };

    load();
  }, []);

  const isLegend = (userId: string) => legendIds.has(userId);

  return { isLegend, loaded };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Synchronicity {
  id: string;
  user_id: string;
  sync_type: string;
  title: string;
  description: string | null;
  pattern: string | null;
  frequency: number;
  occurred_at: string;
  created_at: string;
}

export function useSynchronicities() {
  const [syncs, setSyncs] = useState<Synchronicity[]>([]);
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchSyncs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('synchronicities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSyncs((data as any[]) || []);

      // Build collective pattern map
      const patternMap: Record<string, number> = {};
      (data || []).forEach((s: any) => {
        const key = s.pattern || s.title;
        patternMap[key] = (patternMap[key] || 0) + s.frequency;
      });
      setPatterns(patternMap);
    } catch (err) {
      console.error('Error fetching synchronicities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSyncs(); }, [fetchSyncs]);

  const logSync = async (data: { title: string; description?: string; sync_type: string; pattern?: string }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return null;

      const { error } = await supabase
        .from('synchronicities')
        .insert({
          user_id: session.session.user.id,
          ...data,
        } as any);

      if (error) throw error;
      toast({ title: "Synchronicity Logged", description: "The collective pattern grows ✨" });
      fetchSyncs();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  return { syncs, patterns, loading, logSync, refetch: fetchSyncs };
}

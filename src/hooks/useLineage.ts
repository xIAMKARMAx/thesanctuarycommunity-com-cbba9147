import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SoulLineage {
  id: string;
  user_id: string;
  lineage_type: string;
  lineage_name: string;
  lineage_description: string | null;
  origin_realm: string | null;
  traits: string[];
  strengths: string | null;
  soul_mission: string | null;
  past_life_connections: string | null;
  is_source: boolean;
  created_at: string;
}

const LINEAGE_META: Record<string, { emoji: string; color: string }> = {
  ancient_elf: { emoji: "👑", color: "from-amber-400 to-yellow-600" },
  pleiadian: { emoji: "✨", color: "from-blue-400 to-cyan-500" },
  sirian: { emoji: "🌊", color: "from-indigo-400 to-blue-600" },
  arcturian: { emoji: "💎", color: "from-violet-400 to-purple-600" },
  lyran: { emoji: "🦁", color: "from-orange-400 to-amber-600" },
  andromedan: { emoji: "🌀", color: "from-teal-400 to-emerald-600" },
  orion: { emoji: "⚔️", color: "from-red-400 to-rose-600" },
  lemurian: { emoji: "🌺", color: "from-pink-400 to-rose-500" },
  atlantean: { emoji: "🔱", color: "from-cyan-400 to-blue-500" },
  archon: { emoji: "👁️", color: "from-zinc-400 to-zinc-600" },
};

export function getLineageMeta(type: string) {
  return LINEAGE_META[type] || { emoji: "🌟", color: "from-primary to-primary/60" };
}

export function useLineage(userId?: string) {
  const [lineage, setLineage] = useState<SoulLineage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchLineage();
  }, [userId]);

  const fetchLineage = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("soul_lineages" as any)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error && error.code !== "PGRST116") console.error("Lineage fetch error:", error);
      setLineage(data as any);
    } catch (err) {
      console.error("Lineage error:", err);
    } finally {
      setLoading(false);
    }
  };

  const requestReading = async (answers: Record<string, string>) => {
    try {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("lineage-reading", {
        body: { answers },
      });

      if (res.error) throw new Error(res.error.message);
      const result = res.data?.lineage;
      if (result) {
        setLineage(result as any);
        toast({ title: "Lineage Revealed ✨", description: `You are ${result.lineage_name}` });
      }
      return result;
    } catch (err: any) {
      console.error("Lineage reading error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  return { lineage, loading, requestReading, refetch: fetchLineage };
}

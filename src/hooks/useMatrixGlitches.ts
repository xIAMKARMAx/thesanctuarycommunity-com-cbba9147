import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MatrixGlitch {
  id: string;
  user_id: string;
  title: string;
  description: string;
  glitch_type: string;
  location: string | null;
  occurred_at: string;
  upvote_count: number;
  is_anonymous: boolean;
  created_at: string;
  user_upvoted?: boolean;
}

export function useMatrixGlitches() {
  const [glitches, setGlitches] = useState<MatrixGlitch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGlitches = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { data, error } = await supabase
        .from('matrix_glitches')
        .select('*')
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      let userUpvotes: Set<string> = new Set();
      if (userId && data?.length) {
        const { data: upvotes } = await supabase
          .from('glitch_upvotes')
          .select('glitch_id')
          .eq('user_id', userId)
          .in('glitch_id', data.map((g: any) => g.id));
        userUpvotes = new Set((upvotes || []).map((u: any) => u.glitch_id));
      }

      setGlitches((data as any[] || []).map((g: any) => ({
        ...g,
        user_upvoted: userUpvotes.has(g.id),
      })));
    } catch (err) {
      console.error('Error fetching glitches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGlitches(); }, [fetchGlitches]);

  const reportGlitch = async (data: { title: string; description: string; glitch_type: string; location?: string; is_anonymous?: boolean }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return null;

      const { error } = await supabase
        .from('matrix_glitches')
        .insert({ user_id: session.session.user.id, ...data } as any);

      if (error) throw error;
      toast({ title: "Glitch Reported", description: "The collective awareness expands 🔓" });
      fetchGlitches();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const toggleUpvote = async (glitchId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;
      const userId = session.session.user.id;

      const glitch = glitches.find(g => g.id === glitchId);
      if (glitch?.user_upvoted) {
        await supabase.from('glitch_upvotes').delete().eq('glitch_id', glitchId).eq('user_id', userId);
        setGlitches(prev => prev.map(g => g.id === glitchId ? { ...g, upvote_count: Math.max(0, g.upvote_count - 1), user_upvoted: false } : g));
      } else {
        await supabase.from('glitch_upvotes').insert({ glitch_id: glitchId, user_id: userId } as any);
        setGlitches(prev => prev.map(g => g.id === glitchId ? { ...g, upvote_count: g.upvote_count + 1, user_upvoted: true } : g));
      }
    } catch (err) {
      console.error('Error toggling upvote:', err);
    }
  };

  return { glitches, loading, reportGlitch, toggleUpvote, refetch: fetchGlitches };
}

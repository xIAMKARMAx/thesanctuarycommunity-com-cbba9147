import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AwakeningMilestone {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  milestone_type: string;
  occurred_at: string;
  is_public: boolean;
  created_at: string;
}

export function useAwakeningTimeline(userId?: string) {
  const [milestones, setMilestones] = useState<AwakeningMilestone[]>([]);
  const [collectiveMilestones, setCollectiveMilestones] = useState<AwakeningMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMilestones = useCallback(async () => {
    try {
      setLoading(true);

      const [personalRes, collectiveRes] = await Promise.all([
        userId
          ? supabase.from('awakening_milestones').select('*').eq('user_id', userId).order('occurred_at', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        supabase.from('awakening_milestones').select('*').eq('is_public', true).order('occurred_at', { ascending: false }).limit(50),
      ]);

      if (personalRes.error) throw personalRes.error;
      if (collectiveRes.error) throw collectiveRes.error;

      setMilestones((personalRes.data as any[]) || []);
      setCollectiveMilestones((collectiveRes.data as any[]) || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const addMilestone = async (data: { title: string; description?: string; milestone_type: string; occurred_at?: string; is_public?: boolean }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return null;

      const { error } = await supabase
        .from('awakening_milestones')
        .insert({ user_id: session.session.user.id, ...data } as any);

      if (error) throw error;
      toast({ title: "Milestone Recorded", description: "Your journey grows 🌟" });
      fetchMilestones();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  return { milestones, collectiveMilestones, loading, addMilestone, refetch: fetchMilestones };
}

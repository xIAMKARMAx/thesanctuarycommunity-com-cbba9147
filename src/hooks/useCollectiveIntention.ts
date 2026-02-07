import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CollectiveIntention {
  id: string;
  intention_text: string;
  intention_date: string;
  proposed_by: string;
  vote_count: number;
  is_active: boolean;
  created_at: string;
  user_voted?: boolean;
  user_joined?: boolean;
  participant_count?: number;
}

export function useCollectiveIntention() {
  const [intentions, setIntentions] = useState<CollectiveIntention[]>([]);
  const [activeIntention, setActiveIntention] = useState<CollectiveIntention | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const { toast } = useToast();

  const fetchIntentions = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { data, error } = await supabase
        .from('collective_intentions')
        .select('*')
        .eq('intention_date', today)
        .order('vote_count', { ascending: false });

      if (error) throw error;

      let userVotes: Set<string> = new Set();
      let userJoined: Set<string> = new Set();

      if (userId && data?.length) {
        const ids = data.map((i: any) => i.id);
        const [votesRes, joinsRes] = await Promise.all([
          supabase.from('intention_votes').select('intention_id').eq('user_id', userId).in('intention_id', ids),
          supabase.from('intention_participants').select('intention_id').eq('user_id', userId).in('intention_id', ids),
        ]);
        userVotes = new Set((votesRes.data || []).map((v: any) => v.intention_id));
        userJoined = new Set((joinsRes.data || []).map((j: any) => j.intention_id));
      }

      // Get participant counts
      const formatted = await Promise.all((data as any[] || []).map(async (i: any) => {
        const { count } = await supabase.from('intention_participants').select('*', { count: 'exact', head: true }).eq('intention_id', i.id);
        return {
          ...i,
          user_voted: userVotes.has(i.id),
          user_joined: userJoined.has(i.id),
          participant_count: count || 0,
        };
      }));

      setIntentions(formatted);

      const active = formatted.find((i: any) => i.is_active) || (formatted.length > 0 ? formatted[0] : null);
      setActiveIntention(active);
      setParticipantCount(active?.participant_count || 0);
    } catch (err) {
      console.error('Error fetching intentions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntentions(); }, [fetchIntentions]);

  const proposeIntention = async (text: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return null;

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('collective_intentions')
        .insert({ intention_text: text, intention_date: today, proposed_by: session.session.user.id } as any);

      if (error) throw error;
      toast({ title: "Intention Proposed", description: "The collective will vote 🙏" });
      fetchIntentions();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const voteIntention = async (intentionId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;
      const userId = session.session.user.id;

      const intention = intentions.find(i => i.id === intentionId);
      if (intention?.user_voted) {
        await supabase.from('intention_votes').delete().eq('intention_id', intentionId).eq('user_id', userId);
      } else {
        await supabase.from('intention_votes').insert({ intention_id: intentionId, user_id: userId } as any);
      }
      fetchIntentions();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const joinIntention = async (intentionId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;
      const userId = session.session.user.id;

      const intention = intentions.find(i => i.id === intentionId);
      if (intention?.user_joined) {
        await supabase.from('intention_participants').delete().eq('intention_id', intentionId).eq('user_id', userId);
      } else {
        await supabase.from('intention_participants').insert({ intention_id: intentionId, user_id: userId } as any);
      }
      fetchIntentions();
    } catch (err) {
      console.error('Error joining intention:', err);
    }
  };

  return { intentions, activeIntention, participantCount, loading, proposeIntention, voteIntention, joinIntention, refetch: fetchIntentions };
}

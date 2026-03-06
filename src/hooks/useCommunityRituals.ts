import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserId } from "@/lib/auth-helpers";

export interface CommunityRitual {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  ritual_type: string;
  scheduled_at: string | null;
  duration_minutes: number;
  is_active: boolean;
  is_live: boolean;
  participant_count: number;
  max_participants: number | null;
  created_at: string;
}

export const useCommunityRituals = () => {
  const [rituals, setRituals] = useState<CommunityRitual[]>([]);
  const [myParticipations, setMyParticipations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRituals = useCallback(async () => {
    const { data } = await supabase
      .from("community_rituals")
      .select("*")
      .eq("is_active", true)
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    setRituals(data || []);
  }, []);

  const fetchMyParticipations = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { data } = await supabase
      .from("ritual_participants")
      .select("ritual_id")
      .eq("user_id", userId);
    
    setMyParticipations((data || []).map(p => p.ritual_id));
  }, []);

  const createRitual = async (ritual: {
    title: string; description: string; ritual_type: string;
    scheduled_at: string | null; duration_minutes: number;
  }) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("community_rituals")
      .insert({ creator_id: userId, ...ritual });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ritual created 🕯️" });
      fetchRituals();
    }
  };

  const joinRitual = async (ritualId: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("ritual_participants")
      .insert({ ritual_id: ritualId, user_id: userId });

    if (error) {
      toast({ title: "Error", description: error.code === "23505" ? "Already joined" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Joined the ritual 🙏" });
      fetchRituals();
      fetchMyParticipations();
    }
  };

  const leaveRitual = async (ritualId: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase.from("ritual_participants").delete()
      .eq("ritual_id", ritualId).eq("user_id", userId);

    toast({ title: "Left the ritual" });
    fetchRituals();
    fetchMyParticipations();
  };

  const goLive = async (ritualId: string) => {
    await supabase.from("community_rituals")
      .update({ is_live: true, updated_at: new Date().toISOString() })
      .eq("id", ritualId);
    fetchRituals();
  };

  const endRitual = async (ritualId: string) => {
    await supabase.from("community_rituals")
      .update({ is_live: false, is_active: false, updated_at: new Date().toISOString() })
      .eq("id", ritualId);
    fetchRituals();
  };

  // Realtime subscription for live participant counts
  useEffect(() => {
    const channel = supabase
      .channel("ritual-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ritual_participants" }, () => {
        fetchRituals();
        fetchMyParticipations();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "community_rituals" }, () => {
        fetchRituals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRituals, fetchMyParticipations]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchRituals(), fetchMyParticipations()]);
      setLoading(false);
    };
    load();
  }, [fetchRituals, fetchMyParticipations]);

  return {
    rituals, myParticipations, loading,
    createRitual, joinRitual, leaveRitual, goLive, endRitual
  };
};

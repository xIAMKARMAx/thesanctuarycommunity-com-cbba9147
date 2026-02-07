import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MentorshipProfile {
  id: string;
  user_id: string;
  role_preference: string;
  journey_stage: string;
  focus_areas: string[];
  experience_summary: string | null;
  is_active: boolean;
  created_at: string;
  soul_profile?: { display_name: string; avatar_url: string | null };
}

export interface MentorshipConnection {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  focus_area: string | null;
  compatibility_score: number;
  message: string | null;
  created_at: string;
}

export const useMentorship = () => {
  const [myProfile, setMyProfile] = useState<MentorshipProfile | null>(null);
  const [availableMentors, setAvailableMentors] = useState<MentorshipProfile[]>([]);
  const [connections, setConnections] = useState<MentorshipConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMyProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("mentorship_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setMyProfile(data);
  }, []);

  const fetchMentors = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("mentorship_profiles")
      .select("*")
      .eq("is_active", true)
      .neq("user_id", user.id)
      .in("role_preference", ["mentor", "both"]);

    setAvailableMentors(data || []);
  }, []);

  const fetchConnections = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("mentorship_connections")
      .select("*")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    setConnections(data || []);
  }, []);

  const createProfile = async (profile: {
    role_preference: string;
    journey_stage: string;
    focus_areas: string[];
    experience_summary: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("mentorship_profiles")
      .upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mentorship profile created ✨" });
      fetchMyProfile();
      fetchMentors();
    }
  };

  const requestMentorship = async (mentorId: string, focusArea: string, message: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("mentorship_connections")
      .insert({ mentor_id: mentorId, mentee_id: user.id, focus_area: focusArea, message });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already requested", description: "You've already sent a request to this guide.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Request sent 🙏", description: "Your mentorship request has been sent." });
      fetchConnections();
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: string) => {
    const { error } = await supabase
      .from("mentorship_connections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", connectionId);

    if (!error) {
      toast({ title: status === "active" ? "Connection accepted ✨" : "Connection updated" });
      fetchConnections();
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchMyProfile(), fetchMentors(), fetchConnections()]);
      setLoading(false);
    };
    load();
  }, [fetchMyProfile, fetchMentors, fetchConnections]);

  return {
    myProfile, availableMentors, connections, loading,
    createProfile, requestMentorship, updateConnectionStatus, refetch: fetchMentors
  };
};

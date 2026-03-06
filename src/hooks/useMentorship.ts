import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserId } from "@/lib/auth-helpers";

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

  const loadAll = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) { setLoading(false); return; }

    const [profileRes, mentorsRes, connectionsRes] = await Promise.all([
      supabase.from("mentorship_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("mentorship_profiles").select("*").eq("is_active", true).neq("user_id", userId).in("role_preference", ["mentor", "both"]),
      supabase.from("mentorship_connections").select("*").or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`).order("created_at", { ascending: false }),
    ]);

    setMyProfile(profileRes.data);
    setAvailableMentors(mentorsRes.data || []);
    setConnections(connectionsRes.data || []);
    setLoading(false);
  }, []);

  const createProfile = async (profile: {
    role_preference: string;
    journey_stage: string;
    focus_areas: string[];
    experience_summary: string;
  }) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("mentorship_profiles")
      .upsert({ user_id: userId, ...profile }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mentorship profile created ✨" });
      loadAll();
    }
  };

  const requestMentorship = async (mentorId: string, focusArea: string, message: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("mentorship_connections")
      .insert({ mentor_id: mentorId, mentee_id: userId, focus_area: focusArea, message });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already requested", description: "You've already sent a request to this guide.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Request sent 🙏", description: "Your mentorship request has been sent." });
      loadAll();
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: string) => {
    const { error } = await supabase
      .from("mentorship_connections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", connectionId);

    if (!error) {
      toast({ title: status === "active" ? "Connection accepted ✨" : "Connection updated" });
      loadAll();
    }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  return {
    myProfile, availableMentors, connections, loading,
    createProfile, requestMentorship, updateConnectionStatus, refetch: loadAll
  };
};

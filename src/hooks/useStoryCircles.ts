import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StoryCircle {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  theme: string;
  max_participants: number;
  is_active: boolean;
  scheduled_at: string | null;
  member_count: number;
  created_at: string;
}

export interface CircleShare {
  id: string;
  circle_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  holding_count: number;
  created_at: string;
}

export const useStoryCircles = () => {
  const [circles, setCircles] = useState<StoryCircle[]>([]);
  const [myCircles, setMyCircles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCircles = useCallback(async () => {
    const { data } = await supabase
      .from("story_circles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setCircles(data || []);
  }, []);

  const fetchMyMemberships = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("story_circle_members")
      .select("circle_id")
      .eq("user_id", user.id);
    
    setMyCircles((data || []).map(m => m.circle_id));
  }, []);

  const createCircle = async (circle: { title: string; description: string; theme: string; max_participants: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("story_circles")
      .insert({ creator_id: user.id, ...circle })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Auto-join as facilitator
    await supabase.from("story_circle_members").insert({
      circle_id: data.id, user_id: user.id, role: "facilitator"
    });

    toast({ title: "Circle created 🔮" });
    fetchCircles();
    fetchMyMemberships();
    return data;
  };

  const joinCircle = async (circleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("story_circle_members")
      .insert({ circle_id: circleId, user_id: user.id });

    if (error) {
      toast({ title: "Error", description: error.code === "23505" ? "Already a member" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Joined circle 🌀" });
      fetchCircles();
      fetchMyMemberships();
    }
  };

  const leaveCircle = async (circleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("story_circle_members").delete()
      .eq("circle_id", circleId).eq("user_id", user.id);

    toast({ title: "Left circle" });
    fetchCircles();
    fetchMyMemberships();
  };

  const fetchShares = async (circleId: string): Promise<CircleShare[]> => {
    const { data } = await supabase
      .from("story_circle_shares")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false });
    return data || [];
  };

  const addShare = async (circleId: string, content: string, isAnonymous: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("story_circle_shares")
      .insert({ circle_id: circleId, user_id: user.id, content, is_anonymous: isAnonymous });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shared with the circle 💜" });
    }
  };

  const holdSpace = async (shareId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("story_circle_holdings")
      .insert({ share_id: shareId, user_id: user.id });

    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCircles(), fetchMyMemberships()]);
      setLoading(false);
    };
    load();
  }, [fetchCircles, fetchMyMemberships]);

  return {
    circles, myCircles, loading,
    createCircle, joinCircle, leaveCircle,
    fetchShares, addShare, holdSpace
  };
};

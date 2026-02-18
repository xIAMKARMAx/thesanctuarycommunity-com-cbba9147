import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProfileEcho {
  id: string;
  profile_user_id: string;
  author_user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    avatar_url: string | null;
    soul_title: string | null;
  };
}

export interface EchoComment {
  id: string;
  echo_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: {
    display_name: string;
    avatar_url: string | null;
    soul_title: string | null;
  };
}

export function useProfileEchoes(profileUserId: string) {
  const [echoes, setEchoes] = useState<ProfileEcho[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEchoes = useCallback(async () => {
    if (!profileUserId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profile_echoes")
        .select("*")
        .eq("profile_user_id", profileUserId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data?.length) {
        setEchoes([]);
        setLoading(false);
        return;
      }

      const authorIds = [...new Set(data.map((e) => e.author_user_id))];
      const { data: profiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name, avatar_url, soul_title")
        .in("user_id", authorIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { display_name: string; avatar_url: string | null; soul_title: string | null }>);

      setEchoes(
        data.map((echo) => ({
          ...echo,
          author: profileMap[echo.author_user_id] || undefined,
        }))
      );
    } catch (err) {
      console.error("Error fetching echoes:", err);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  const sendEcho = async (content: string, imageUrl?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }

      const { data, error } = await supabase
        .from("profile_echoes")
        .insert({
          profile_user_id: profileUserId,
          author_user_id: session.session.user.id,
          content,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      fetchEchoes();
      return data;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const deleteEcho = async (echoId: string) => {
    try {
      const { error } = await supabase.from("profile_echoes").delete().eq("id", echoId);
      if (error) throw error;
      setEchoes((prev) => prev.filter((e) => e.id !== echoId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Echo comments
  const fetchEchoComments = async (echoId: string): Promise<EchoComment[]> => {
    try {
      const { data, error } = await supabase
        .from("echo_comments")
        .select("*")
        .eq("echo_id", echoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data?.length) return [];

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name, avatar_url, soul_title")
        .in("user_id", userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { display_name: string; avatar_url: string | null; soul_title: string | null }>);

      return data.map((c) => ({
        ...c,
        author: profileMap[c.user_id] || undefined,
      }));
    } catch (err) {
      console.error("Error fetching echo comments:", err);
      return [];
    }
  };

  const addEchoComment = async (echoId: string, content: string, imageUrl?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }

      const { data, error } = await supabase
        .from("echo_comments")
        .insert({
          echo_id: echoId,
          user_id: session.session.user.id,
          content,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const deleteEchoComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from("echo_comments").delete().eq("id", commentId);
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return {
    echoes,
    loading,
    fetchEchoes,
    sendEcho,
    deleteEcho,
    fetchEchoComments,
    addEchoComment,
    deleteEchoComment,
  };
}

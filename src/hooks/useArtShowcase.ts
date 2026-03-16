import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ArtSubmission {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  average_rating: number;
  total_votes: number;
  comment_count: number;
  is_art_of_month: boolean;
  art_of_month_date: string | null;
  created_at: string;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
  user_vote?: number | null;
}

export interface ArtComment {
  id: string;
  submission_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export function useArtShowcase() {
  const [submissions, setSubmissions] = useState<ArtSubmission[]>([]);
  const [artOfMonth, setArtOfMonth] = useState<ArtSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "top_rated">("newest");
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;

      // Fetch submissions
      let query = supabase
        .from("art_showcase_submissions")
        .select("*");

      if (sortBy === "top_rated") {
        query = query.order("average_rating", { ascending: false }).order("total_votes", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: subs, error } = await query.limit(50);
      if (error) throw error;
      if (!subs?.length) {
        setSubmissions([]);
        setArtOfMonth(null);
        setLoading(false);
        return;
      }

      // Get profiles and user votes in parallel
      const userIds = [...new Set(subs.map((s: any) => s.user_id))];
      const subIds = subs.map((s: any) => s.id);

      const [profilesRes, votesRes] = await Promise.all([
        supabase.from("soul_profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        currentUserId
          ? supabase.from("art_showcase_votes").select("submission_id, rating").eq("user_id", currentUserId).in("submission_id", subIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      (profilesRes.data || []).forEach((p: any) => {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      const voteMap: Record<string, number> = {};
      (votesRes.data || []).forEach((v: any) => {
        voteMap[v.submission_id] = v.rating;
      });

      const formatted: ArtSubmission[] = subs.map((s: any) => ({
        ...s,
        author: profileMap[s.user_id] || undefined,
        user_vote: voteMap[s.id] || null,
      }));

      // Find art of month
      const aotm = formatted.find((s) => s.is_art_of_month);
      setArtOfMonth(aotm || null);
      setSubmissions(formatted);
    } catch (err) {
      console.error("Error fetching showcase:", err);
      toast({ title: "Error", description: "Could not load showcase", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, sortBy]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const submitArt = async (title: string, description: string, imageUrl: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign In Required", description: "Please sign in to submit art", variant: "destructive" });
        return null;
      }

      const { data, error } = await supabase
        .from("art_showcase_submissions")
        .insert({ user_id: session.session.user.id, title, description: description || null, image_url: imageUrl })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Art Submitted! ✨", description: "Your creation is now in Ki'emani's Showcase" });
      fetchSubmissions();
      return data;
    } catch (err: any) {
      console.error("Error submitting art:", err);
      toast({ title: "Error", description: err.message || "Could not submit art", variant: "destructive" });
      return null;
    }
  };

  const voteArt = async (submissionId: string, rating: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign In Required", description: "Please sign in to vote", variant: "destructive" });
        return;
      }

      // Upsert vote
      const { error } = await supabase
        .from("art_showcase_votes")
        .upsert(
          { submission_id: submissionId, user_id: session.session.user.id, rating },
          { onConflict: "submission_id,user_id" }
        );

      if (error) throw error;

      // Optimistic update
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, user_vote: rating } : s
        )
      );

      // Refresh to get accurate average
      setTimeout(() => fetchSubmissions(), 500);
    } catch (err) {
      console.error("Error voting:", err);
      toast({ title: "Error", description: "Could not submit vote", variant: "destructive" });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase.from("art_showcase_submissions").delete().eq("id", submissionId);
      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      toast({ title: "Removed", description: "Your art has been removed from the showcase" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not delete", variant: "destructive" });
    }
  };

  return { submissions, artOfMonth, loading, sortBy, setSortBy, submitArt, voteArt, deleteSubmission, refetch: fetchSubmissions };
}

export function useArtComments(submissionId: string | null) {
  const [comments, setComments] = useState<ArtComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("art_showcase_comments")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("soul_profiles").select("user_id, display_name, avatar_url").in("user_id", userIds)
        : { data: [] };

      const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      setComments(
        (data || []).map((c: any) => ({
          ...c,
          author: profileMap[c.user_id] || undefined,
        }))
      );
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!submissionId) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign In Required", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("art_showcase_comments")
        .insert({ submission_id: submissionId, user_id: session.session.user.id, content });

      if (error) throw error;
      fetchComments();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not post comment", variant: "destructive" });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from("art_showcase_comments").delete().eq("id", commentId);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return { comments, loading, addComment, deleteComment, refetch: fetchComments };
}

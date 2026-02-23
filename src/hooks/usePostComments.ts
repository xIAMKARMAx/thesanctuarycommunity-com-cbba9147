import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  image_url: string | null;
  blessing_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    soul_title: string | null;
    avatar_url: string | null;
  };
  user_reaction?: { id: string; blessing_type: string } | null;
  reactions_summary?: Record<string, number>;
}

interface SoulProfileRow {
  user_id: string;
  display_name: string;
  soul_title: string | null;
  avatar_url: string | null;
}

export const COMMENT_REACTION_TYPES = [
  { type: "star", emoji: "⭐", label: "Bless" },
  { type: "love", emoji: "💜", label: "Love" },
  { type: "resonate", emoji: "🔮", label: "Resonate" },
  { type: "light", emoji: "✨", label: "Light" },
  { type: "flame", emoji: "🔥", label: "Ignite" },
] as const;

export function usePostComments(postId: string) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;

      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!commentsData?.length) {
        setComments([]);
        setLoading(false);
        return;
      }

      const commentIds = commentsData.map(c => c.id);
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      // Fetch profiles, all blessings for counts, and user's own blessings in parallel
      const [profilesRes, blessingsRes, userBlessingsRes] = await Promise.all([
        supabase.from('soul_profiles').select('user_id, display_name, soul_title, avatar_url').in('user_id', userIds),
        supabase.from('comment_blessings').select('comment_id, blessing_type').in('comment_id', commentIds),
        currentUserId
          ? supabase.from('comment_blessings').select('id, comment_id, blessing_type').in('comment_id', commentIds).eq('user_id', currentUserId)
          : Promise.resolve({ data: [] }),
      ]);

      const profilesMap = (profilesRes.data || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, SoulProfileRow>);

      // Build reactions summary per comment
      const reactionsByComment: Record<string, Record<string, number>> = {};
      for (const b of (blessingsRes.data || [])) {
        if (!reactionsByComment[b.comment_id]) reactionsByComment[b.comment_id] = {};
        reactionsByComment[b.comment_id][b.blessing_type] = (reactionsByComment[b.comment_id][b.blessing_type] || 0) + 1;
      }

      // User's own reactions
      const userReactionsByComment: Record<string, { id: string; blessing_type: string }> = {};
      for (const b of (userBlessingsRes.data || [])) {
        userReactionsByComment[b.comment_id] = { id: b.id, blessing_type: b.blessing_type };
      }

      const formattedComments: PostComment[] = commentsData.map(comment => ({
        ...comment,
        author: profilesMap[comment.user_id] ? {
          display_name: profilesMap[comment.user_id].display_name,
          soul_title: profilesMap[comment.user_id].soul_title,
          avatar_url: profilesMap[comment.user_id].avatar_url,
        } : undefined,
        user_reaction: userReactionsByComment[comment.id] || null,
        reactions_summary: reactionsByComment[comment.id] || {},
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = async (content: string, parentCommentId?: string, imageUrl?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to comment",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: session.session.user.id,
          content,
          parent_comment_id: parentCommentId || null,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      fetchComments();
      return data;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast({
        title: "Error",
        description: err.message || "Could not add comment",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast({
        title: "Error",
        description: err.message || "Could not delete comment",
        variant: "destructive",
      });
    }
  };

  const reactToComment = async (commentId: string, reactionType: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign In Required", description: "Please sign in to react", variant: "destructive" });
        return;
      }

      const userId = session.session.user.id;
      const comment = comments.find(c => c.id === commentId);
      
      if (comment?.user_reaction) {
        // Remove existing reaction
        await supabase.from('comment_blessings').delete().eq('id', comment.user_reaction.id);
        
        // If same type, just remove. If different, add new one.
        if (comment.user_reaction.blessing_type === reactionType) {
          setComments(prev => prev.map(c => c.id === commentId ? {
            ...c,
            blessing_count: Math.max(0, c.blessing_count - 1),
            user_reaction: null,
            reactions_summary: {
              ...c.reactions_summary,
              [comment.user_reaction!.blessing_type]: Math.max(0, (c.reactions_summary?.[comment.user_reaction!.blessing_type] || 1) - 1),
            },
          } : c));
          return;
        }
      }

      // Add new reaction
      const { data, error } = await supabase
        .from('comment_blessings')
        .insert({ comment_id: commentId, user_id: userId, blessing_type: reactionType })
        .select('id, blessing_type')
        .single();

      if (error) throw error;

      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const oldType = c.user_reaction?.blessing_type;
        const newSummary = { ...c.reactions_summary };
        if (oldType) newSummary[oldType] = Math.max(0, (newSummary[oldType] || 1) - 1);
        newSummary[reactionType] = (newSummary[reactionType] || 0) + 1;
        return {
          ...c,
          blessing_count: c.blessing_count + (oldType ? 0 : 1),
          user_reaction: { id: data.id, blessing_type: data.blessing_type },
          reactions_summary: newSummary,
        };
      }));
    } catch (err: any) {
      console.error('Error reacting to comment:', err);
    }
  };

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment,
    reactToComment,
  };
}

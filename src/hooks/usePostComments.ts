import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  blessing_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    soul_title: string | null;
    avatar_url: string | null;
  };
}

interface SoulProfileRow {
  user_id: string;
  display_name: string;
  soul_title: string | null;
  avatar_url: string | null;
}

export function usePostComments(postId: string) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      // Fetch comments
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

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('soul_profiles')
        .select('user_id, display_name, soul_title, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, SoulProfileRow>);

      const formattedComments: PostComment[] = commentsData.map(comment => ({
        ...comment,
        author: profilesMap[comment.user_id] ? {
          display_name: profilesMap[comment.user_id].display_name,
          soul_title: profilesMap[comment.user_id].soul_title,
          avatar_url: profilesMap[comment.user_id].avatar_url,
        } : undefined,
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = async (content: string, parentCommentId?: string) => {
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

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment,
  };
}

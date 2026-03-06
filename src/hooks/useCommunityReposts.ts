import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/auth-helpers";

export function useCommunityReposts() {
  const [reposting, setReposting] = useState<string | null>(null);

  const repostPost = useCallback(async (postId: string): Promise<boolean> => {
    setReposting(postId);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("Please sign in to repost");
        return false;
      }

      // Check if already reposted
      const { data: existing } = await supabase
        .from('post_reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('post_reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
        toast.success("Repost removed");
        return false;
      } else {
        const { error } = await supabase
          .from('post_reposts')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
        toast.success("Reposted to your connections!");
        return true;
      }
    } catch (error: any) {
      console.error("Repost error:", error);
      toast.error("Failed to repost");
      return false;
    } finally {
      setReposting(null);
    }
  }, []);

  const checkUserRepost = useCallback(async (postId: string, userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('post_reposts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    return !!data;
  }, []);

  return { repostPost, checkUserRepost, reposting };
}

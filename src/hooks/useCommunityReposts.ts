import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCommunityReposts() {
  const [reposting, setReposting] = useState<string | null>(null);

  const repostPost = useCallback(async (postId: string): Promise<boolean> => {
    setReposting(postId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to repost");
        return false;
      }

      // Check if already reposted
      const { data: existing } = await supabase
        .from('post_reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Remove repost
        const { error } = await supabase
          .from('post_reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success("Repost removed");
        return false;
      } else {
        // Add repost
        const { error } = await supabase
          .from('post_reposts')
          .insert({ post_id: postId, user_id: user.id });

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

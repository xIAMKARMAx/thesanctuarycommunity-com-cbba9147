import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFollows(currentUserId?: string) {
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFollowData = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      // Get accurate counts from database RPC
      const { data: counts } = await supabase.rpc('get_follow_counts', { p_user_id: currentUserId });
      if (counts) {
        setFollowerCount((counts as any).follower_count || 0);
        setFollowingCount((counts as any).following_count || 0);
      }

      // Get who current user follows (for isFollowing checks)
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      // Get who follows current user (for isFollower checks)
      const { data: followersData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', currentUserId);

      setFollowing(followingData?.map(f => f.following_id) || []);
      setFollowers(followersData?.map(f => f.follower_id) || []);
    } catch (err) {
      console.error('Error fetching follow data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  const followUser = async (targetUserId: string) => {
    if (!currentUserId) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to follow others",
        variant: "destructive",
      });
      return;
    }

    if (targetUserId === currentUserId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

      if (error) throw error;

      setFollowing(prev => [...prev, targetUserId]);
      toast({
        title: "Connected",
        description: "You are now following this soul ✨",
      });
    } catch (err: any) {
      console.error('Error following user:', err);
      toast({
        title: "Error",
        description: err.message || "Could not follow user",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setFollowing(prev => prev.filter(id => id !== targetUserId));
      toast({
        title: "Disconnected",
        description: "You have unfollowed this soul",
      });
    } catch (err: any) {
      console.error('Error unfollowing user:', err);
    }
  };

  const isFollowing = (targetUserId: string) => following.includes(targetUserId);
  const isFollower = (targetUserId: string) => followers.includes(targetUserId);

  return {
    following,
    followers,
    followingCount,
    followerCount,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    isFollower,
    refetch: fetchFollowData,
  };
}

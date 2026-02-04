import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommunityPost } from "./useCommunityFeed";

interface SoulProfileRow {
  user_id: string;
  display_name: string;
  soul_title: string | null;
  avatar_url: string | null;
}

export function useAligningZoneFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [shuffleSeed, setShuffleSeed] = useState(Date.now());
  const { toast } = useToast();

  const fetchPosts = useCallback(async (offset = 0, limit = 20) => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;

      // Fetch ALL public posts for discovery (not filtered by following)
      // Order by a mix of recency and engagement for FYP-style discovery
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;
      if (!postsData?.length) {
        if (offset === 0) setPosts([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Shuffle posts for discovery variety using the seed
      const shuffledPosts = [...postsData].sort((a, b) => {
        // Weight by engagement + recency + randomness
        const engagementA = (a.blessing_count || 0) + (a.comment_count || 0) * 2 + (a.repost_count || 0) * 3;
        const engagementB = (b.blessing_count || 0) + (b.comment_count || 0) * 2 + (b.repost_count || 0) * 3;
        
        const recencyA = new Date(a.created_at).getTime();
        const recencyB = new Date(b.created_at).getTime();
        
        // Add randomness based on shuffle seed
        const randomA = (shuffleSeed % (parseInt(a.id.slice(-4), 16) || 1)) / 65535;
        const randomB = (shuffleSeed % (parseInt(b.id.slice(-4), 16) || 1)) / 65535;
        
        // Combined score: engagement * 0.3 + recency * 0.3 + random * 0.4
        const scoreA = (engagementA * 0.3) + (recencyA / 1e12 * 0.3) + (randomA * 0.4);
        const scoreB = (engagementB * 0.3) + (recencyB / 1e12 * 0.3) + (randomB * 0.4);
        
        return scoreB - scoreA;
      });

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(shuffledPosts.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('soul_profiles')
        .select('user_id, display_name, soul_title, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, SoulProfileRow>);

      // Get user's blessings for these posts
      let userBlessings: Record<string, string> = {};
      if (currentUserId) {
        const postIds = shuffledPosts.map(p => p.id);
        const { data: blessingsData } = await supabase
          .from('post_blessings')
          .select('post_id, blessing_type')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        if (blessingsData) {
          userBlessings = blessingsData.reduce((acc, b) => {
            acc[b.post_id] = b.blessing_type;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const formattedPosts: CommunityPost[] = shuffledPosts.map(post => ({
        ...post,
        author: profilesMap[post.user_id] ? {
          display_name: profilesMap[post.user_id].display_name,
          soul_title: profilesMap[post.user_id].soul_title,
          avatar_url: profilesMap[post.user_id].avatar_url,
        } : undefined,
        user_blessing: userBlessings[post.id] || null,
      }));

      if (offset === 0) {
        setPosts(formattedPosts);
      } else {
        setPosts(prev => [...prev, ...formattedPosts]);
      }
      
      setHasMore(formattedPosts.length === limit);
    } catch (err) {
      console.error('Error fetching aligning zone posts:', err);
      toast({
        title: "Error",
        description: "Could not load discovery feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, shuffleSeed]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const blessPost = async (postId: string, blessingType: string = 'love') => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to bless this post",
          variant: "destructive",
        });
        return;
      }

      const post = posts.find(p => p.id === postId);
      
      if (post?.user_blessing) {
        await supabase
          .from('post_blessings')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.session.user.id);

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, blessing_count: Math.max(0, p.blessing_count - 1), user_blessing: null }
            : p
        ));
      } else {
        await supabase
          .from('post_blessings')
          .insert({
            post_id: postId,
            user_id: session.session.user.id,
            blessing_type: blessingType,
          });

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, blessing_count: p.blessing_count + 1, user_blessing: blessingType }
            : p
        ));
      }
    } catch (err) {
      console.error('Error blessing post:', err);
    }
  };

  const shuffle = () => {
    setShuffleSeed(Date.now());
  };

  return {
    posts,
    loading,
    hasMore,
    blessPost,
    loadMore: () => fetchPosts(posts.length),
    refetch: () => fetchPosts(0),
    shuffle,
  };
}

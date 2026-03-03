import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  post_type: string;
  visibility: string;
  is_pinned: boolean;
  blessing_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  energy_tag: string | null;
  is_anonymous: boolean;
  intention: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    soul_title: string | null;
    avatar_url: string | null;
  };
  user_blessing?: string | null;
}

interface SoulProfileRow {
  user_id: string;
  display_name: string;
  soul_title: string | null;
  avatar_url: string | null;
}

export function useCommunityFeed(energyFilter?: string | null) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async (offset = 0, limit = 20) => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;

      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('visibility', 'public')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (energyFilter) {
        query = query.eq('energy_tag', energyFilter);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;
      if (!postsData?.length) {
        if (offset === 0) setPosts([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Get unique user IDs (exclude anonymous posts)
      const nonAnonPosts = postsData.filter(p => !p.is_anonymous);
      const userIds = [...new Set(nonAnonPosts.map(p => p.user_id))];
      const postIds = postsData.map(p => p.id);

      // Parallel batch: profiles + blessings
      const [profilesResult, blessingsResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from('soul_profiles').select('user_id, display_name, soul_title, avatar_url').in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        currentUserId
          ? supabase.from('post_blessings').select('post_id, blessing_type').eq('user_id', currentUserId).in('post_id', postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profilesMap: Record<string, SoulProfileRow> = (profilesResult.data || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, SoulProfileRow>);

      const userBlessings: Record<string, string> = (blessingsResult.data || []).reduce((acc, b) => {
        acc[b.post_id] = b.blessing_type;
        return acc;
      }, {} as Record<string, string>);

      const formattedPosts: CommunityPost[] = postsData.map(post => ({
        ...post,
        energy_tag: post.energy_tag || null,
        is_anonymous: post.is_anonymous || false,
        intention: post.intention || null,
        author: post.is_anonymous ? undefined : (profilesMap[post.user_id] ? {
          display_name: profilesMap[post.user_id].display_name,
          soul_title: profilesMap[post.user_id].soul_title,
          avatar_url: profilesMap[post.user_id].avatar_url,
        } : undefined),
        user_blessing: userBlessings[post.id] || null,
      }));

      if (offset === 0) {
        setPosts(formattedPosts);
      } else {
        setPosts(prev => [...prev, ...formattedPosts]);
      }
      
      setHasMore(formattedPosts.length === limit);
    } catch (err) {
      console.error('Error fetching posts:', err);
      toast({
        title: "Error",
        description: "Could not load community posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, energyFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (content: string, postType: string = 'insight', imageUrl?: string, videoUrl?: string, energyTag?: string, isAnonymous?: boolean, imageUrls?: string[]) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to share with the collective",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: session.session.user.id,
          content,
          post_type: postType,
          image_url: imageUrl || null,
          video_url: videoUrl || null,
          image_urls: imageUrls || null,
          energy_tag: energyTag || null,
          is_anonymous: isAnonymous || false,
        } as any)
        .select()
        .single();

      if (error) throw error;

      fetchPosts();
      
      toast({
        title: isAnonymous ? "Shared Anonymously" : "Shared with the Collective",
        description: isAnonymous 
          ? "Your truth has been shared anonymously ✨" 
          : "Your message has been sent to the community ✨",
      });
      return data;
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast({
        title: "Error",
        description: err.message || "Could not share post",
        variant: "destructive",
      });
      return null;
    }
  };

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

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({
        title: "Post Removed",
        description: "Your post has been deleted",
      });
    } catch (err: any) {
      console.error('Error deleting post:', err);
      toast({
        title: "Error",
        description: err.message || "Could not delete post",
        variant: "destructive",
      });
    }
  };

  return {
    posts,
    loading,
    hasMore,
    createPost,
    blessPost,
    deletePost,
    loadMore: () => fetchPosts(posts.length),
    refetch: () => fetchPosts(0),
  };
}

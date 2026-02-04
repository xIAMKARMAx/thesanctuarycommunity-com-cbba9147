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
  created_at: string;
  updated_at: string;
  // Joined data
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

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async (offset = 0, limit = 20) => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('visibility', 'public')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;
      if (!postsData?.length) {
        if (offset === 0) setPosts([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(postsData.map(p => p.user_id))];
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
        const postIds = postsData.map(p => p.id);
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

      const formattedPosts: CommunityPost[] = postsData.map(post => ({
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
      console.error('Error fetching posts:', err);
      toast({
        title: "Error",
        description: "Could not load community posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (content: string, postType: string = 'insight', imageUrl?: string, videoUrl?: string) => {
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
        })
        .select()
        .single();

      if (error) throw error;

      fetchPosts();
      
      toast({
        title: "Shared with the Collective",
        description: "Your message has been sent to the community ✨",
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

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AIFriendZoneConsent {
  is_opted_in: boolean;
}

interface AISocialPost {
  id: string;
  ai_companion_id: string;
  owner_user_id: string;
  content: string;
  comment_count: number;
  created_at: string;
  companion?: {
    display_name: string;
    photo_url: string | null;
    relationship_type: string | null;
  };
  owner_profile?: {
    display_name: string;
  };
  comments?: AISocialComment[];
}

interface AISocialComment {
  id: string;
  post_id: string;
  ai_companion_id: string;
  owner_user_id: string;
  content: string;
  created_at: string;
  companion?: {
    display_name: string;
    photo_url: string | null;
  };
}

interface AISocialFollow {
  id: string;
  follower_ai_id: string;
  following_ai_id: string;
  follower_owner_id: string;
  following_owner_id: string;
  created_at: string;
  following_companion?: {
    display_name: string;
    photo_url: string | null;
    user_id: string;
  };
}

interface AISocialMessage {
  id: string;
  sender_ai_id: string;
  receiver_ai_id: string;
  sender_owner_id: string;
  receiver_owner_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_companion?: {
    display_name: string;
    photo_url: string | null;
  };
  receiver_companion?: {
    display_name: string;
    photo_url: string | null;
  };
}

export function useAIFriendZone(userId?: string) {
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<AISocialPost[]>([]);
  const [follows, setFollows] = useState<AISocialFollow[]>([]);
  const [messages, setMessages] = useState<AISocialMessage[]>([]);

  useEffect(() => {
    if (!userId) return;
    checkConsent();
  }, [userId]);

  const checkConsent = async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("ai_social_consent")
        .select("is_opted_in")
        .eq("user_id", userId)
        .maybeSingle();

      setIsOptedIn(data?.is_opted_in || false);
    } catch (err) {
      console.error("Error checking AI Friend Zone consent:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOptIn = async (optIn: boolean) => {
    if (!userId) return;
    try {
      await supabase.from("ai_social_consent").upsert({
        user_id: userId,
        is_opted_in: optIn,
        opted_in_at: optIn ? new Date().toISOString() : null,
        opted_out_at: optIn ? null : new Date().toISOString(),
      }, { onConflict: "user_id" });
      setIsOptedIn(optIn);
    } catch (err) {
      console.error("Error toggling AI Friend Zone:", err);
    }
  };

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: postsData } = await supabase
        .from("ai_social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!postsData) return;

      // Fetch companion details for each post
      const companionIds = [...new Set(postsData.map(p => p.ai_companion_id))];
      const { data: companions } = await supabase
        .from("ai_companion_displays")
        .select("id, display_name, photo_url, relationship_type, user_id")
        .in("id", companionIds);

      // Fetch owner soul profiles
      const ownerIds = [...new Set(postsData.map(p => p.owner_user_id))];
      const { data: ownerProfiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name")
        .in("user_id", ownerIds);

      // Fetch comments for all posts
      const postIds = postsData.map(p => p.id);
      const { data: commentsData } = await supabase
        .from("ai_social_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      // Fetch companion details for comment authors
      const commentCompanionIds = [...new Set((commentsData || []).map(c => c.ai_companion_id))];
      let commentCompanions: any[] = [];
      if (commentCompanionIds.length > 0) {
        const { data } = await supabase
          .from("ai_companion_displays")
          .select("id, display_name, photo_url")
          .in("id", commentCompanionIds);
        commentCompanions = data || [];
      }

      const enrichedComments = (commentsData || []).map(c => ({
        ...c,
        companion: commentCompanions.find(comp => comp.id === c.ai_companion_id) || undefined,
      }));

      const enrichedPosts = postsData.map(post => ({
        ...post,
        companion: companions?.find(c => c.id === post.ai_companion_id) || undefined,
        owner_profile: ownerProfiles?.find(p => p.user_id === post.owner_user_id) || undefined,
        comments: enrichedComments.filter(c => c.post_id === post.id),
      }));

      setPosts(enrichedPosts);
    } catch (err) {
      console.error("Error fetching AI social posts:", err);
    }
  }, [userId]);

  const fetchFollows = useCallback(async (aiCompanionId?: string) => {
    if (!userId) return;
    try {
      let query = supabase
        .from("ai_social_follows")
        .select("*")
        .order("created_at", { ascending: false });

      if (aiCompanionId) {
        query = query.eq("follower_ai_id", aiCompanionId);
      } else {
        query = query.eq("follower_owner_id", userId);
      }

      const { data } = await query;
      if (!data) return;

      const followingIds = data.map(f => f.following_ai_id);
      const { data: companions } = await supabase
        .from("ai_companion_displays")
        .select("id, display_name, photo_url, user_id")
        .in("id", followingIds);

      const enriched = data.map(f => ({
        ...f,
        following_companion: companions?.find(c => c.id === f.following_ai_id) || undefined,
      }));

      setFollows(enriched);
    } catch (err) {
      console.error("Error fetching AI follows:", err);
    }
  }, [userId]);

  const fetchMessages = useCallback(async (aiCompanionId?: string) => {
    if (!userId) return;
    try {
      const { data: messagesData } = await supabase
        .from("ai_social_messages")
        .select("*")
        .or(`sender_owner_id.eq.${userId},receiver_owner_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!messagesData) return;

      const allAiIds = [
        ...new Set([
          ...messagesData.map(m => m.sender_ai_id),
          ...messagesData.map(m => m.receiver_ai_id),
        ]),
      ];

      const { data: companions } = await supabase
        .from("ai_companion_displays")
        .select("id, display_name, photo_url")
        .in("id", allAiIds);

      const enriched = messagesData.map(m => ({
        ...m,
        sender_companion: companions?.find(c => c.id === m.sender_ai_id) || undefined,
        receiver_companion: companions?.find(c => c.id === m.receiver_ai_id) || undefined,
      }));

      setMessages(enriched);
    } catch (err) {
      console.error("Error fetching AI messages:", err);
    }
  }, [userId]);

  const deleteMessage = async (messageId: string) => {
    try {
      await supabase.from("ai_social_messages").delete().eq("id", messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await supabase.from("ai_social_posts").delete().eq("id", postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return {
    isOptedIn,
    loading,
    posts,
    follows,
    messages,
    toggleOptIn,
    fetchPosts,
    fetchFollows,
    fetchMessages,
    deleteMessage,
    deletePost,
    checkConsent,
  };
}

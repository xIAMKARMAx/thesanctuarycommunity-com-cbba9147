import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  view_count: number;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  stories: Story[];
  has_unviewed: boolean;
}

export function useStories() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStories = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      setCurrentUserId(userId || null);

      // Fetch active (non-expired) stories
      const { data: storiesData, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!storiesData?.length) {
        setStoryGroups([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(storiesData.map((s: any) => s.user_id))];
      
      const [profilesRes, viewsRes] = await Promise.all([
        supabase.from("soul_profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        userId
          ? supabase.from("story_views").select("story_id").eq("viewer_id", userId)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      (profilesRes.data || []).forEach((p: any) => {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      const viewedStoryIds = new Set((viewsRes.data || []).map((v: any) => v.story_id));

      // Group stories by user
      const groups: Record<string, StoryGroup> = {};
      storiesData.forEach((story: any) => {
        if (!groups[story.user_id]) {
          const profile = profileMap[story.user_id];
          groups[story.user_id] = {
            user_id: story.user_id,
            display_name: profile?.display_name || "Soul",
            avatar_url: profile?.avatar_url || null,
            stories: [],
            has_unviewed: false,
          };
        }
        groups[story.user_id].stories.push(story);
        if (!viewedStoryIds.has(story.id) && story.user_id !== userId) {
          groups[story.user_id].has_unviewed = true;
        }
      });

      // Sort: current user first, then unviewed, then viewed
      const sorted = Object.values(groups).sort((a, b) => {
        if (a.user_id === userId) return -1;
        if (b.user_id === userId) return 1;
        if (a.has_unviewed && !b.has_unviewed) return -1;
        if (!a.has_unviewed && b.has_unviewed) return 1;
        return 0;
      });

      setStoryGroups(sorted);
    } catch (err) {
      console.error("Error fetching stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const createStory = async (mediaUrl: string, mediaType: string = "image", caption?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }

      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: session.session.user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Story shared ✨" });
      fetchStories();
      return data;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const markViewed = async (storyId: string) => {
    if (!currentUserId) return;
    try {
      await supabase.from("story_views").insert({
        story_id: storyId,
        viewer_id: currentUserId,
      } as any);
    } catch {
      // Ignore duplicate view errors
    }
  };

  return { storyGroups, loading, createStory, markViewed, refetch: fetchStories, currentUserId };
}

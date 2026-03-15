import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Hashtag {
  id: string;
  tag: string;
  post_count: number;
  trending_score: number;
}

export function useTrendingHashtags(limit = 10) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("hashtags")
        .select("id, tag, post_count, trending_score")
        .order("post_count", { ascending: false })
        .limit(limit);

      if (!error && data) {
        setHashtags(data as any);
      }
      setLoading(false);
    };
    fetch();
  }, [limit]);

  return { hashtags, loading };
}

export function useHashtagPosts(tag: string | null) {
  const [postIds, setPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag) {
      setPostIds([]);
      return;
    }
    setLoading(true);
    const fetch = async () => {
      const { data: hashtagData } = await supabase
        .from("hashtags")
        .select("id")
        .eq("tag", tag.toLowerCase())
        .single();

      if (!hashtagData) {
        setPostIds([]);
        setLoading(false);
        return;
      }

      const { data: links } = await supabase
        .from("post_hashtags")
        .select("post_id")
        .eq("hashtag_id", (hashtagData as any).id)
        .order("created_at", { ascending: false })
        .limit(50);

      setPostIds((links || []).map((l: any) => l.post_id));
      setLoading(false);
    };
    fetch();
  }, [tag]);

  return { postIds, loading };
}

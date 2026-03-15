
-- Stories table (24hr ephemeral content)
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Story views tracking
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Hashtags registry
CREATE TABLE public.hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  post_count INTEGER NOT NULL DEFAULT 0,
  trending_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Post-hashtag junction
CREATE TABLE public.post_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Indexes
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_hashtags_trending ON public.hashtags(trending_score DESC);
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX idx_post_hashtags_post_id ON public.post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);

-- RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- Stories: anyone authenticated can view active stories, owners manage their own
CREATE POLICY "Anyone can view active stories" ON public.stories FOR SELECT TO authenticated USING (expires_at > now());
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story views: viewers can insert their view, story owners can see views
CREATE POLICY "Users can mark stories viewed" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Users can see own views" ON public.story_views FOR SELECT TO authenticated USING (auth.uid() = viewer_id);
CREATE POLICY "Story owners can see views" ON public.story_views FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_id AND stories.user_id = auth.uid())
);

-- Hashtags: public read, system manages writes
CREATE POLICY "Anyone can read hashtags" ON public.hashtags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update hashtags" ON public.hashtags FOR UPDATE TO authenticated USING (true);

-- Post hashtags: public read, post owners manage
CREATE POLICY "Anyone can read post hashtags" ON public.post_hashtags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert post hashtags" ON public.post_hashtags FOR INSERT TO authenticated WITH CHECK (true);

-- Function to auto-extract and link hashtags from a post
CREATE OR REPLACE FUNCTION public.process_post_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tag TEXT;
  hashtag_record_id UUID;
BEGIN
  -- Extract hashtags from content
  FOR tag IN
    SELECT DISTINCT lower(regexp_replace(m[1], '[^a-zA-Z0-9_]', '', 'g'))
    FROM regexp_matches(NEW.content, '#([a-zA-Z0-9_]+)', 'g') AS m
  LOOP
    IF length(tag) > 0 AND length(tag) <= 50 THEN
      -- Upsert hashtag
      INSERT INTO public.hashtags (tag, post_count, last_used_at)
      VALUES (tag, 1, now())
      ON CONFLICT (tag) DO UPDATE SET
        post_count = hashtags.post_count + 1,
        last_used_at = now()
      RETURNING id INTO hashtag_record_id;

      -- Link post to hashtag
      INSERT INTO public.post_hashtags (post_id, hashtag_id)
      VALUES (NEW.id, hashtag_record_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to process hashtags on post creation
CREATE TRIGGER trg_process_post_hashtags
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_post_hashtags();

-- Function to update view count on stories
CREATE OR REPLACE FUNCTION public.increment_story_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.stories SET view_count = view_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_story_views
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_story_views();

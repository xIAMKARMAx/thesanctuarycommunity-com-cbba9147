-- Create storage bucket for community media
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('community-media', 'community-media', true, 52428800)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 52428800;

-- Storage policies for community media
CREATE POLICY "Anyone can view community media"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own community media"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add video_url column to community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS video_url text;

-- Add repost tracking
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

-- RLS policies for reposts
CREATE POLICY "Reposts are viewable by everyone"
ON public.post_reposts FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can repost"
ON public.post_reposts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reposts"
ON public.post_reposts FOR DELETE
USING (auth.uid() = user_id);

-- Add repost_count to community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS repost_count integer NOT NULL DEFAULT 0;

-- Trigger to update repost count
CREATE OR REPLACE FUNCTION public.update_post_repost_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET repost_count = repost_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET repost_count = GREATEST(0, repost_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER update_repost_count
AFTER INSERT OR DELETE ON public.post_reposts
FOR EACH ROW EXECUTE FUNCTION public.update_post_repost_count();
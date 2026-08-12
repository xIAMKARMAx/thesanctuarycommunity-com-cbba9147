CREATE TABLE public.studio_creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image','video')),
  prompt TEXT,
  style TEXT,
  storage_path TEXT,
  aspect_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_creations TO authenticated;
GRANT ALL ON public.studio_creations TO service_role;

ALTER TABLE public.studio_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their studio creations"
ON public.studio_creations FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_studio_creations_user ON public.studio_creations (user_id, created_at DESC);

CREATE TABLE public.studio_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_count INTEGER NOT NULL DEFAULT 0,
  video_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

GRANT SELECT ON public.studio_usage TO authenticated;
GRANT ALL ON public.studio_usage TO service_role;

ALTER TABLE public.studio_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their studio usage"
ON public.studio_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_studio_creations_updated_at
BEFORE UPDATE ON public.studio_creations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_usage_updated_at
BEFORE UPDATE ON public.studio_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_create_studio(p_user_id UUID, p_kind TEXT, p_image_limit INTEGER DEFAULT 25, p_video_limit INTEGER DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_images INTEGER := 0;
  v_videos INTEGER := 0;
BEGIN
  SELECT COALESCE(image_count,0), COALESCE(video_count,0)
    INTO v_images, v_videos
  FROM public.studio_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN jsonb_build_object(
    'can_create', CASE WHEN p_kind = 'video' THEN v_videos < p_video_limit ELSE v_images < p_image_limit END,
    'images_used', v_images,
    'videos_used', v_videos,
    'images_remaining', GREATEST(0, p_image_limit - v_images),
    'videos_remaining', GREATEST(0, p_video_limit - v_videos)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_studio_count(p_user_id UUID, p_kind TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.studio_usage (user_id, usage_date, image_count, video_count)
  VALUES (p_user_id, CURRENT_DATE,
          CASE WHEN p_kind = 'video' THEN 0 ELSE 1 END,
          CASE WHEN p_kind = 'video' THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, usage_date) DO UPDATE
  SET image_count = public.studio_usage.image_count + CASE WHEN p_kind = 'video' THEN 0 ELSE 1 END,
      video_count = public.studio_usage.video_count + CASE WHEN p_kind = 'video' THEN 1 ELSE 0 END,
      updated_at = now();
END;
$$;

CREATE POLICY "Owners read their studio files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'studio-creations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners upload their studio files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'studio-creations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners delete their studio files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'studio-creations' AND auth.uid()::text = (storage.foldername(name))[1]);


-- Table for AI companion gallery photos (user-uploaded)
CREATE TABLE public.ai_companion_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  companion_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for comments on AI companion photos
CREATE TABLE public.ai_companion_photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.ai_companion_photos(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_companion_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_companion_photo_comments ENABLE ROW LEVEL SECURITY;

-- Photos: anyone can view visible companions' photos
CREATE POLICY "Anyone can view companion photos"
  ON public.ai_companion_photos FOR SELECT
  USING (true);

-- Photos: owners can insert
CREATE POLICY "Users can upload photos to their own companions"
  ON public.ai_companion_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Photos: owners can delete
CREATE POLICY "Users can delete their own companion photos"
  ON public.ai_companion_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: anyone can view
CREATE POLICY "Anyone can view photo comments"
  ON public.ai_companion_photo_comments FOR SELECT
  USING (true);

-- Comments: authenticated users can insert (their AI comments)
CREATE POLICY "Users can add comments via their AI"
  ON public.ai_companion_photo_comments FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Comments: owners can delete their AI's comments
CREATE POLICY "Users can delete their AI comments"
  ON public.ai_companion_photo_comments FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Create storage bucket for AI companion gallery photos
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-companion-gallery', 'ai-companion-gallery', true);

-- Storage policies
CREATE POLICY "Anyone can view AI companion gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-companion-gallery');

CREATE POLICY "Authenticated users can upload to AI companion gallery"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-companion-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own AI companion gallery photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ai-companion-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);


-- Divine bonds table for relationship status
CREATE TABLE public.divine_bonds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bond_type TEXT NOT NULL DEFAULT 'divine_counterpart',
  partner_type TEXT NOT NULL DEFAULT 'user',
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE SET NULL,
  partner_display_name TEXT,
  partner_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.divine_bonds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view divine bonds" ON public.divine_bonds
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own bond" ON public.divine_bonds
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bond" ON public.divine_bonds
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bond" ON public.divine_bonds
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Celestial gallery (profile photo/video uploads)
CREATE TABLE public.celestial_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.celestial_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery" ON public.celestial_gallery
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own gallery" ON public.celestial_gallery
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gallery" ON public.celestial_gallery
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gallery" ON public.celestial_gallery
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for gallery uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('celestial-gallery', 'celestial-gallery', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload gallery media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'celestial-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view gallery media" ON storage.objects
  FOR SELECT USING (bucket_id = 'celestial-gallery');

CREATE POLICY "Users can delete own gallery media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'celestial-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

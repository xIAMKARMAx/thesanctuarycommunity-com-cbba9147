
-- Table for 3D avatar add-on subscriptions
CREATE TABLE public.immersive_3d_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  stripe_subscription_id text,
  started_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table for user 3D avatars (Ready Player Me GLB URLs)
CREATE TABLE public.user_3d_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glb_url text NOT NULL,
  rpm_avatar_id text,
  thumbnail_url text,
  display_name text DEFAULT 'My Avatar',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.immersive_3d_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_3d_avatars ENABLE ROW LEVEL SECURITY;

-- RLS policies for immersive_3d_subscriptions
CREATE POLICY "Users can view own 3d subscription" ON public.immersive_3d_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 3d subscription" ON public.immersive_3d_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 3d subscription" ON public.immersive_3d_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for user_3d_avatars
CREATE POLICY "Users can view own 3d avatars" ON public.user_3d_avatars
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 3d avatars" ON public.user_3d_avatars
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 3d avatars" ON public.user_3d_avatars
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 3d avatars" ON public.user_3d_avatars
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Others can view active avatars in realms (for multiplayer future)
CREATE POLICY "Anyone can view active 3d avatars" ON public.user_3d_avatars
  FOR SELECT TO authenticated USING (is_active = true);

-- Storage bucket for 3D avatar GLB files  
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('3d-avatars', '3d-avatars', true, 10485760);

-- Storage policies for 3d-avatars bucket
CREATE POLICY "Users can upload 3d avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = '3d-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own 3d avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = '3d-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read for 3d avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = '3d-avatars');

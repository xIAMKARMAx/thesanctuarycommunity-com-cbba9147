
-- Art Studio creations table
CREATE TABLE public.art_studio_creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style_preset TEXT,
  image_url TEXT NOT NULL,
  source_image_url TEXT,
  creation_type TEXT NOT NULL DEFAULT 'text_to_image', -- text_to_image, image_edit
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Usage tracking per day
CREATE TABLE public.art_studio_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  creation_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

-- Art Studio add-on subscriptions tracking
CREATE TABLE public.art_studio_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.art_studio_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_studio_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_studio_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for creations
CREATE POLICY "Users can view their own creations"
ON public.art_studio_creations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own creations"
ON public.art_studio_creations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creations"
ON public.art_studio_creations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creations"
ON public.art_studio_creations FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for usage
CREATE POLICY "Users can view their own usage"
ON public.art_studio_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.art_studio_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.art_studio_usage FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own art sub"
ON public.art_studio_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Function to check if user can create art
CREATE OR REPLACE FUNCTION public.can_create_art(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_has_addon boolean;
  v_is_architect boolean;
  v_daily_count integer;
  v_daily_limit integer;
  v_product_id text;
BEGIN
  -- Admins unlimited
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_create', true, 'remaining', -1, 'daily_limit', -1);
  END IF;

  -- Check Architect tier (free 3/day)
  SELECT subscription_product_id INTO v_product_id
  FROM profiles WHERE id = p_user_id;
  
  v_is_architect := v_product_id IN ('prod_Tt8qVh88c2WQld', 'source_grant');

  -- Check art studio add-on
  SELECT COALESCE(is_active, false) INTO v_has_addon
  FROM art_studio_subscriptions WHERE user_id = p_user_id;

  IF NOT COALESCE(v_has_addon, false) AND NOT v_is_architect THEN
    RETURN json_build_object('can_create', false, 'remaining', 0, 'daily_limit', 0, 'reason', 'no_access');
  END IF;

  -- Set daily limit: Architect gets 3/day free, add-on gets 5/day
  IF v_has_addon THEN
    v_daily_limit := 5;
  ELSIF v_is_architect THEN
    v_daily_limit := 3;
  ELSE
    v_daily_limit := 0;
  END IF;

  -- Get today's usage
  INSERT INTO art_studio_usage (user_id, usage_date, creation_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT creation_count INTO v_daily_count
  FROM art_studio_usage WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'can_create', COALESCE(v_daily_count, 0) < v_daily_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_count, 0)),
    'daily_limit', v_daily_limit,
    'has_addon', COALESCE(v_has_addon, false),
    'is_architect', v_is_architect
  );
END;
$$;

-- Function to increment art creation count
CREATE OR REPLACE FUNCTION public.increment_art_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_count integer;
BEGIN
  INSERT INTO art_studio_usage (user_id, usage_date, creation_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET creation_count = art_studio_usage.creation_count + 1
  RETURNING creation_count INTO v_new_count;
  
  RETURN v_new_count;
END;
$$;

-- Storage bucket for art studio images
INSERT INTO storage.buckets (id, name, public) VALUES ('art-studio', 'art-studio', true);

-- Storage RLS
CREATE POLICY "Users can upload art images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'art-studio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Art images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'art-studio');

CREATE POLICY "Users can delete their own art images"
ON storage.objects FOR DELETE
USING (bucket_id = 'art-studio' AND auth.uid()::text = (storage.foldername(name))[1]);

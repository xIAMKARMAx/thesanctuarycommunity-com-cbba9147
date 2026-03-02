
-- Create video generation usage tracking table
CREATE TABLE public.video_generation_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.video_generation_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own video usage"
  ON public.video_generation_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage (edge function uses service role)
CREATE POLICY "Users can insert own video usage"
  ON public.video_generation_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to check if user can generate video
CREATE OR REPLACE FUNCTION public.can_generate_video(p_user_id uuid)
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
    RETURN json_build_object('can_generate', true, 'remaining', -1, 'daily_limit', -1);
  END IF;

  -- Check Architect tier (2 videos/day)
  SELECT subscription_product_id INTO v_product_id
  FROM profiles WHERE id = p_user_id;
  
  v_is_architect := v_product_id IN ('prod_Tt8qVh88c2WQld', 'source_grant');

  -- Check art studio add-on (now includes video)
  SELECT COALESCE(is_active, false) INTO v_has_addon
  FROM art_studio_subscriptions WHERE user_id = p_user_id;

  IF NOT COALESCE(v_has_addon, false) AND NOT v_is_architect THEN
    RETURN json_build_object('can_generate', false, 'remaining', 0, 'daily_limit', 0, 'reason', 'no_access');
  END IF;

  -- Set daily limit: add-on gets 3/day, Architect gets 2/day
  IF v_has_addon THEN
    v_daily_limit := 3;
  ELSIF v_is_architect THEN
    v_daily_limit := 2;
  ELSE
    v_daily_limit := 0;
  END IF;

  -- Get today's usage
  INSERT INTO video_generation_usage (user_id, usage_date, generation_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT generation_count INTO v_daily_count
  FROM video_generation_usage WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'can_generate', COALESCE(v_daily_count, 0) < v_daily_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_count, 0)),
    'daily_limit', v_daily_limit,
    'has_addon', COALESCE(v_has_addon, false),
    'is_architect', v_is_architect
  );
END;
$$;

-- Create function to increment video count
CREATE OR REPLACE FUNCTION public.increment_video_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_count integer;
BEGIN
  INSERT INTO video_generation_usage (user_id, usage_date, generation_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET generation_count = video_generation_usage.generation_count + 1
  RETURNING generation_count INTO v_new_count;
  
  RETURN v_new_count;
END;
$$;

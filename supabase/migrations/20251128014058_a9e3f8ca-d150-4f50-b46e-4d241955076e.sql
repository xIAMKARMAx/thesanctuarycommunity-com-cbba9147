-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_status text DEFAULT 'free',
ADD COLUMN subscription_id text,
ADD COLUMN stripe_customer_id text,
ADD COLUMN subscription_current_period_end timestamp with time zone;

-- Create table to track daily image generation usage
CREATE TABLE public.image_generation_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  generation_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, generation_date)
);

ALTER TABLE public.image_generation_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for image_generation_usage
CREATE POLICY "Users can view their own usage"
  ON public.image_generation_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.image_generation_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.image_generation_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if user can generate image
CREATE OR REPLACE FUNCTION public.can_generate_image(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_status text;
  v_today_count integer;
BEGIN
  -- Get user's subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM profiles
  WHERE id = p_user_id;
  
  -- Pro users have unlimited access
  IF v_subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Free users: check daily limit
  SELECT COALESCE(count, 0) INTO v_today_count
  FROM image_generation_usage
  WHERE user_id = p_user_id
    AND generation_date = CURRENT_DATE;
  
  RETURN v_today_count < 1;
END;
$$;

-- Function to increment image generation count
CREATE OR REPLACE FUNCTION public.increment_image_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO image_generation_usage (user_id, generation_date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, generation_date)
  DO UPDATE SET count = image_generation_usage.count + 1;
END;
$$;
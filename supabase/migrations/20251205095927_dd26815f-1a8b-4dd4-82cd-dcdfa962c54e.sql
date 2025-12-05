-- Update can_send_message to limit free users to 10 messages instead of 20
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_messages integer;
  v_is_subscribed boolean;
BEGIN
  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, total_messages)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT total_messages INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Free users limited to 10 messages
  RETURN COALESCE(v_total_messages, 0) < 10;
END;
$$;

-- Update can_generate_room to always return false for free users (Pro only)
CREATE OR REPLACE FUNCTION public.can_generate_room(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_subscribed boolean;
BEGIN
  -- Check if user has active subscription - room generation is Pro only
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_subscribed, false);
END;
$$;

-- Update can_generate_avatar to always return false for free users (Pro only)
CREATE OR REPLACE FUNCTION public.can_generate_avatar(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_subscribed boolean;
BEGIN
  -- Check if user has active subscription - avatar generation is Pro only
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_subscribed, false);
END;
$$;

-- Update can_generate_image to always return false for free users (Pro only)
CREATE OR REPLACE FUNCTION public.can_generate_image(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_subscribed boolean;
BEGIN
  -- Check if user has active subscription - image generation is Pro only
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_subscribed, false);
END;
$$;
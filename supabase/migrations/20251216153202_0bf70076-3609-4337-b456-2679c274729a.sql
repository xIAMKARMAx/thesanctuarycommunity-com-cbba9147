-- Add timestamp columns to track when avatar/room were last generated
ALTER TABLE public.free_user_limits 
ADD COLUMN IF NOT EXISTS avatar_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS room_generated_at TIMESTAMP WITH TIME ZONE;

-- Update can_generate_avatar to check 30-day cooldown
CREATE OR REPLACE FUNCTION public.can_generate_avatar(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_last_generated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user has active subscription - unlimited for Pro
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check when avatar was last generated
  SELECT avatar_generated_at INTO v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Allow if never generated OR 30 days have passed
  RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '30 days';
END;
$function$;

-- Update can_generate_room to check 30-day cooldown
CREATE OR REPLACE FUNCTION public.can_generate_room(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_last_generated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user has active subscription - unlimited for Pro
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check when room was last generated
  SELECT room_generated_at INTO v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Allow if never generated OR 30 days have passed
  RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '30 days';
END;
$function$;

-- Update mark_avatar_generated to set timestamp
CREATE OR REPLACE FUNCTION public.mark_avatar_generated(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO free_user_limits (user_id, avatar_generated, avatar_generated_at)
  VALUES (p_user_id, true, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET avatar_generated = true, avatar_generated_at = NOW(), updated_at = NOW();
END;
$function$;

-- Update mark_room_generated to set timestamp
CREATE OR REPLACE FUNCTION public.mark_room_generated(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO free_user_limits (user_id, room_generated, room_generated_at)
  VALUES (p_user_id, true, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET room_generated = true, room_generated_at = NOW(), updated_at = NOW();
END;
$function$;
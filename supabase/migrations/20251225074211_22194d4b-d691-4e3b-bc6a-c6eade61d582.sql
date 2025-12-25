-- Update can_generate_room to give subscribers weekly limits (not unlimited)
CREATE OR REPLACE FUNCTION public.can_generate_room(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_last_generated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  -- Free users: no access at all
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN false;
  END IF;
  
  -- Subscribed users: 1 per 7 days
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check when room was last generated
  SELECT room_generated_at INTO v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Allow if never generated OR 7 days have passed
  RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '7 days';
END;
$function$;

-- Update can_generate_avatar to give subscribers weekly limits (not unlimited)
CREATE OR REPLACE FUNCTION public.can_generate_avatar(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_last_generated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  -- Free users: no access at all
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN false;
  END IF;
  
  -- Subscribed users: 1 per 7 days
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check when avatar was last generated
  SELECT avatar_generated_at INTO v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Allow if never generated OR 7 days have passed
  RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '7 days';
END;
$function$;
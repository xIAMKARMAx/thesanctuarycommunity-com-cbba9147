-- Update can_send_message: Free users get 25 messages/day even after trial (no trial expiration blocking)
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_daily_messages integer;
  v_last_message_date date;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription - unlimited messages
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE 
  SET trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE);
  
  -- Get current limits
  SELECT daily_messages, last_message_date 
  INTO v_daily_messages, v_last_message_date
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Reset daily count if it's a new day
  IF v_last_message_date IS NULL OR v_last_message_date < CURRENT_DATE THEN
    UPDATE free_user_limits 
    SET daily_messages = 0, last_message_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_daily_messages := 0;
  END IF;
  
  -- Free users always get 25 messages per day (no trial expiration)
  RETURN v_daily_messages < 25;
END;
$function$;

-- Update can_generate_room: Free users get 1 total, Pro users get 1 per 7 days
CREATE OR REPLACE FUNCTION public.can_generate_room(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_room_generated boolean;
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
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check room generation status
  SELECT room_generated, room_generated_at INTO v_room_generated, v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  IF v_is_subscribed THEN
    -- Subscribed users: 1 per 7 days
    RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '7 days';
  ELSE
    -- Free users: only 1 total ever
    RETURN NOT COALESCE(v_room_generated, false);
  END IF;
END;
$function$;

-- Update can_generate_avatar: Free users get 1 total, Pro users get 1 per 7 days
CREATE OR REPLACE FUNCTION public.can_generate_avatar(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_avatar_generated boolean;
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
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check avatar generation status
  SELECT avatar_generated, avatar_generated_at INTO v_avatar_generated, v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  IF v_is_subscribed THEN
    -- Subscribed users: 1 per 7 days
    RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '7 days';
  ELSE
    -- Free users: only 1 total ever
    RETURN NOT COALESCE(v_avatar_generated, false);
  END IF;
END;
$function$;

-- Update can_generate_pet: Free users get 1 total, Pro users get 1 per 7 days
CREATE OR REPLACE FUNCTION public.can_generate_pet(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_pet_generated boolean;
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
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check pet generation status
  SELECT pet_generated, pet_generated_at INTO v_pet_generated, v_last_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;
  
  IF v_is_subscribed THEN
    -- Subscribed users: 1 per 7 days
    RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '7 days';
  ELSE
    -- Free users: only 1 total ever
    RETURN NOT COALESCE(v_pet_generated, false);
  END IF;
END;
$function$;

-- can_generate_image stays the same (Pro only, 10 per 24h handled in can_generate_chat_image)
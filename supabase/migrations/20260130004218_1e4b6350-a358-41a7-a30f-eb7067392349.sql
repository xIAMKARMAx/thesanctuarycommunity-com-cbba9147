-- Update can_generate_avatar to use 3-day cooldown instead of 7-day
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
    -- Subscribed users: 1 per 3 days (changed from 7 days)
    RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '3 days';
  ELSE
    -- Free users: only 1 total ever
    RETURN NOT COALESCE(v_avatar_generated, false);
  END IF;
END;
$function$;

-- Update can_generate_room to use 3-day cooldown instead of 7-day
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
    -- Subscribed users: 1 per 3 days (changed from 7 days)
    RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '3 days';
  ELSE
    -- Free users: only 1 total ever
    RETURN NOT COALESCE(v_room_generated, false);
  END IF;
END;
$function$;

-- Update can_generate_pet to use 3-day cooldown instead of 7-day
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
    -- Subscribed users: 1 per 3 days (changed from 7 days)
    RETURN v_last_generated_at IS NULL OR v_last_generated_at < NOW() - INTERVAL '3 days';
  ELSE
    -- Free users: only 1 total ever
    RETURN NOT COALESCE(v_pet_generated, false);
  END IF;
END;
$function$;

-- Create function to get generation cooldown info (for countdown display)
CREATE OR REPLACE FUNCTION public.get_generation_cooldown(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_avatar_generated_at TIMESTAMP WITH TIME ZONE;
  v_room_generated_at TIMESTAMP WITH TIME ZONE;
  v_pet_generated_at TIMESTAMP WITH TIME ZONE;
  v_cooldown_days integer := 3;
  v_avatar_available_at TIMESTAMP WITH TIME ZONE;
  v_room_available_at TIMESTAMP WITH TIME ZONE;
  v_pet_available_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Admins have no cooldown
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object(
      'is_admin', true,
      'avatar_can_generate', true,
      'room_can_generate', true,
      'pet_can_generate', true,
      'avatar_available_at', null,
      'room_available_at', null,
      'pet_available_at', null
    );
  END IF;

  -- Check subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  -- Get last generated timestamps
  SELECT avatar_generated_at, room_generated_at, pet_generated_at
  INTO v_avatar_generated_at, v_room_generated_at, v_pet_generated_at
  FROM free_user_limits WHERE user_id = p_user_id;

  -- Calculate when each becomes available (for subscribers only)
  IF v_is_subscribed THEN
    v_avatar_available_at := CASE 
      WHEN v_avatar_generated_at IS NULL THEN NULL
      ELSE v_avatar_generated_at + (v_cooldown_days || ' days')::interval
    END;
    v_room_available_at := CASE 
      WHEN v_room_generated_at IS NULL THEN NULL
      ELSE v_room_generated_at + (v_cooldown_days || ' days')::interval
    END;
    v_pet_available_at := CASE 
      WHEN v_pet_generated_at IS NULL THEN NULL
      ELSE v_pet_generated_at + (v_cooldown_days || ' days')::interval
    END;
  END IF;

  RETURN json_build_object(
    'is_admin', false,
    'is_subscribed', COALESCE(v_is_subscribed, false),
    'cooldown_days', v_cooldown_days,
    'avatar_can_generate', v_avatar_generated_at IS NULL OR v_avatar_generated_at < NOW() - (v_cooldown_days || ' days')::interval,
    'room_can_generate', v_room_generated_at IS NULL OR v_room_generated_at < NOW() - (v_cooldown_days || ' days')::interval,
    'pet_can_generate', v_pet_generated_at IS NULL OR v_pet_generated_at < NOW() - (v_cooldown_days || ' days')::interval,
    'avatar_available_at', v_avatar_available_at,
    'room_available_at', v_room_available_at,
    'pet_available_at', v_pet_available_at,
    'avatar_generated_at', v_avatar_generated_at,
    'room_generated_at', v_room_generated_at,
    'pet_generated_at', v_pet_generated_at
  );
END;
$function$;
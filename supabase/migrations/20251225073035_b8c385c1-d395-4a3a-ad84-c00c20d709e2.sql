-- Insert admin role for the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('5b2818a4-be23-4d81-b0a3-ec2e49411603', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update can_send_message to check admin first
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_trial_start date;
  v_days_since_trial integer;
  v_daily_messages integer;
  v_last_message_date date;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits with trial start date
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE 
  SET trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE);
  
  -- Get current limits
  SELECT daily_messages, last_message_date, trial_start_date 
  INTO v_daily_messages, v_last_message_date, v_trial_start
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Calculate days since trial started
  v_days_since_trial := CURRENT_DATE - COALESCE(v_trial_start, CURRENT_DATE);
  
  -- Trial expired after 5 days - no more free messages
  IF v_days_since_trial >= 5 THEN
    RETURN false;
  END IF;
  
  -- Reset daily count if it's a new day
  IF v_last_message_date < CURRENT_DATE THEN
    UPDATE free_user_limits 
    SET daily_messages = 0, last_message_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_daily_messages := 0;
  END IF;
  
  -- Allow 25 messages per day during trial
  RETURN v_daily_messages < 25;
END;
$function$;

-- Update can_generate_image to check admin first
CREATE OR REPLACE FUNCTION public.can_generate_image(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription - image generation is Pro only
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_subscribed, false);
END;
$function$;

-- Update can_generate_room to check admin first
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

-- Update can_generate_avatar to check admin first
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

-- Update can_generate_pet to check admin first
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
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

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
  
  -- Check if pet was already generated
  SELECT COALESCE(pet_generated, false) INTO v_pet_generated
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Allow only if never generated
  RETURN NOT v_pet_generated;
END;
$function$;
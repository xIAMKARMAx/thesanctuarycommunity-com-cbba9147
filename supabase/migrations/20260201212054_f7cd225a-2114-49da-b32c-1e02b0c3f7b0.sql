-- Update can_send_message to allow 25 messages PER DAY for free users (instead of 10-20 total)
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

  -- Check if user has active subscription - unlimited messages (with cooldown handled separately)
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current daily count
  SELECT daily_messages, last_message_date
  INTO v_daily_messages, v_last_message_date
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Reset count if new day
  IF v_last_message_date IS NULL OR v_last_message_date < CURRENT_DATE THEN
    RETURN true; -- New day, can send
  END IF;
  
  -- Free users get 25 messages per day
  RETURN COALESCE(v_daily_messages, 0) < 25;
END;
$function$;

-- Update increment_message_count to properly reset daily count
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_last_date date;
BEGIN
  -- Get current state
  SELECT daily_messages, last_message_date INTO v_count, v_last_date
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Reset if new day
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    v_count := 0;
  END IF;
  
  -- Insert or update - reset daily count if new day, always increment total
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 1, CURRENT_DATE, CURRENT_DATE, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    daily_messages = CASE 
      WHEN free_user_limits.last_message_date < CURRENT_DATE THEN 1 
      ELSE free_user_limits.daily_messages + 1 
    END,
    last_message_date = CURRENT_DATE,
    total_messages = free_user_limits.total_messages + 1,
    trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE),
    updated_at = now()
  RETURNING daily_messages INTO v_count;
  
  RETURN v_count;
END;
$function$;
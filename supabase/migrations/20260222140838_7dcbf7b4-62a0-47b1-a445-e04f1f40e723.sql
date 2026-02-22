
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_total_messages integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Free users get exactly 5 total messages
  SELECT total_messages
  INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_total_messages, 0) < 5;
END;
$function$;

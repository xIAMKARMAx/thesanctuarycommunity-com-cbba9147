
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
  v_ai_imported boolean;
  v_message_limit integer;
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
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Free users get 25 total messages, or 35 if they imported their AI
  SELECT total_messages, COALESCE(ai_imported, false)
  INTO v_total_messages, v_ai_imported
  FROM free_user_limits WHERE user_id = p_user_id;
  
  v_message_limit := CASE WHEN v_ai_imported THEN 35 ELSE 25 END;
  
  RETURN COALESCE(v_total_messages, 0) < v_message_limit;
END;
$function$;

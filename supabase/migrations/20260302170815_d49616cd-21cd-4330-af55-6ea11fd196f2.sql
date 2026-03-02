
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
  v_product_id text;
  v_daily_messages integer;
  v_last_date date;
  v_daily_limit integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id 
  INTO v_is_subscribed, v_product_id
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    IF v_product_id IN ('source_grant', 'prod_Tt8qVh88c2WQld') THEN
      RETURN true;
    END IF;
    
    IF v_product_id = 'prod_TgZlr0QLYQPqEn' THEN
      RETURN true;
    END IF;
    
    IF v_product_id = 'prod_U3xV1AfsrdaJTz' THEN
      v_daily_limit := 150;
    ELSIF v_product_id = 'prod_TtTdHv6WE0qozS' THEN
      v_daily_limit := 50;
    ELSIF v_product_id = 'prod_U3xVsHqEFcsR2V' THEN
      v_daily_limit := 75;
    ELSE
      v_daily_limit := 75;
    END IF;
    
    INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
    VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT daily_messages, last_message_date INTO v_daily_messages, v_last_date
    FROM free_user_limits WHERE user_id = p_user_id;
    
    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
      v_daily_messages := 0;
    END IF;
    
    RETURN COALESCE(v_daily_messages, 0) < v_daily_limit;
  END IF;
  
  -- Free users: 25 lifetime messages
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT total_messages
  INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_total_messages, 0) < 25;
END;
$function$;

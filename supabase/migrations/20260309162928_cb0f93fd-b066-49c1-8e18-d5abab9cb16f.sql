
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
  v_legacy_unlimited boolean;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    -- Source grant always unlimited
    IF v_product_id = 'source_grant' THEN RETURN true; END IF;
    -- New Earth: unlimited
    IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN RETURN true; END IF;
    -- Architect: unlimited
    IF v_product_id = 'prod_Tt8qVh88c2WQld' THEN RETURN true; END IF;
    -- Legacy Anchoring: unlimited
    IF v_product_id = 'prod_TgZlr0QLYQPqEn' THEN RETURN true; END IF;
    
    -- New Anchoring: 250/day
    IF v_product_id = 'prod_U3xV1AfsrdaJTz' THEN
      v_daily_limit := 250;
    -- Legacy Awakening: 50/day
    ELSIF v_product_id = 'prod_TtTdHv6WE0qozS' THEN
      v_daily_limit := 50;
    -- New Awakening: 100/day
    ELSIF v_product_id = 'prod_U3xVsHqEFcsR2V' THEN
      v_daily_limit := 100;
    ELSE
      v_daily_limit := 100;
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
  
  -- FREE USERS: 20 messages TOTAL (no daily reset, no trial period)
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT total_messages INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- 20 messages total, ever
  RETURN COALESCE(v_total_messages, 0) < 20;
END;
$function$;

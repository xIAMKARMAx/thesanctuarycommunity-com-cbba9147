
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
    IF v_product_id = 'source_grant' THEN
      RETURN true;
    END IF;
    
    -- New Earth: unlimited
    IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
      RETURN true;
    END IF;
    
    -- Architect: unlimited
    IF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
      RETURN true;
    END IF;
    
    -- Legacy Anchoring: unlimited
    IF v_product_id = 'prod_TgZlr0QLYQPqEn' THEN
      RETURN true;
    END IF;
    
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
  
  -- Free users: 25 lifetime messages
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT total_messages INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_total_messages, 0) < 25;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_send_chat_message(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_product_id text;
  v_cooldown record;
  v_cooldown_end timestamp with time zone;
  v_daily_limit integer;
  v_daily_messages integer;
  v_last_date date;
  v_legacy_unlimited boolean;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited
  FROM profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- New Earth: TRULY unlimited, NO cooldown
  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Architect: unlimited with 100/hr cooldown
  IF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    IF v_legacy_unlimited THEN
      UPDATE chat_cooldowns SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
      WHERE user_id = p_user_id AND (cooldown_started_at IS NOT NULL OR message_count > 0);
      RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
    END IF;
    
    INSERT INTO chat_cooldowns (user_id, message_count, period_started_at)
    VALUES (p_user_id, 0, now())
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_cooldown FROM chat_cooldowns WHERE user_id = p_user_id;
    
    IF v_cooldown.cooldown_started_at IS NOT NULL THEN
      v_cooldown_end := v_cooldown.cooldown_started_at + INTERVAL '1 hour';
      IF now() < v_cooldown_end THEN
        RETURN json_build_object('can_send', false, 'remaining', 0, 'cooldown_ends_at', v_cooldown_end, 'in_cooldown', true);
      ELSE
        UPDATE chat_cooldowns SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
        WHERE user_id = p_user_id;
      END IF;
    END IF;

    RETURN json_build_object(
      'can_send', true, 'remaining', -1, 'cooldown_ends_at', null,
      'cooldown_remaining', GREATEST(0, 100 - COALESCE(v_cooldown.message_count, 0))
    );
  END IF;

  -- Legacy Anchoring: unlimited with 100/hr cooldown
  IF v_product_id = 'prod_TgZlr0QLYQPqEn' THEN
    INSERT INTO chat_cooldowns (user_id, message_count, period_started_at)
    VALUES (p_user_id, 0, now())
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_cooldown FROM chat_cooldowns WHERE user_id = p_user_id;
    
    IF v_cooldown.cooldown_started_at IS NOT NULL THEN
      v_cooldown_end := v_cooldown.cooldown_started_at + INTERVAL '1 hour';
      IF now() < v_cooldown_end THEN
        RETURN json_build_object('can_send', false, 'remaining', 0, 'cooldown_ends_at', v_cooldown_end, 'in_cooldown', true);
      ELSE
        UPDATE chat_cooldowns SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
        WHERE user_id = p_user_id;
        RETURN json_build_object('can_send', true, 'remaining', 100, 'cooldown_ends_at', null);
      END IF;
    END IF;
    
    RETURN json_build_object(
      'can_send', v_cooldown.message_count < 100,
      'remaining', GREATEST(0, 100 - v_cooldown.message_count),
      'cooldown_ends_at', null
    );
  END IF;

  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- New Anchoring: 250/day
  IF v_product_id = 'prod_U3xV1AfsrdaJTz' THEN v_daily_limit := 250;
  -- Legacy Awakening: 50/day
  ELSIF v_product_id = 'prod_TtTdHv6WE0qozS' THEN v_daily_limit := 50;
  -- New Awakening: 100/day
  ELSIF v_product_id = 'prod_U3xVsHqEFcsR2V' THEN v_daily_limit := 100;
  ELSE v_daily_limit := 100;
  END IF;

  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT daily_messages, last_message_date INTO v_daily_messages, v_last_date
  FROM free_user_limits WHERE user_id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN v_daily_messages := 0; END IF;

  RETURN json_build_object(
    'can_send', COALESCE(v_daily_messages, 0) < v_daily_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_messages, 0)),
    'cooldown_ends_at', null, 'daily_limit', v_daily_limit
  );
END;
$function$;

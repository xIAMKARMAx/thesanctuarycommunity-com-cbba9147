
-- Add legacy_unlimited flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legacy_unlimited boolean NOT NULL DEFAULT false;

-- Update can_send_message to enforce 300/day for new Architect users
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
    
    -- Architect: legacy users unlimited, new users 300/day
    IF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
      IF v_legacy_unlimited THEN
        RETURN true;
      END IF;
      v_daily_limit := 300;
    -- Legacy Anchoring: unlimited
    ELSIF v_product_id = 'prod_TgZlr0QLYQPqEn' THEN
      RETURN true;
    -- New Anchoring
    ELSIF v_product_id = 'prod_U3xV1AfsrdaJTz' THEN
      v_daily_limit := 150;
    -- Legacy Awakening
    ELSIF v_product_id = 'prod_TtTdHv6WE0qozS' THEN
      v_daily_limit := 50;
    -- New Awakening
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
  
  SELECT total_messages INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_total_messages, 0) < 25;
END;
$function$;

-- Update can_send_chat_message to enforce 300/day + 100/hr cooldown for new Architect
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
  -- Admins have unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Check subscription status, product id, and legacy flag
  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited
  FROM profiles WHERE id = p_user_id;

  -- Source grant always unlimited
  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Architect: legacy users bypass entirely, new users get 300/day + 100/hr cooldown
  IF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    IF v_legacy_unlimited THEN
      UPDATE chat_cooldowns SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
      WHERE user_id = p_user_id AND (cooldown_started_at IS NOT NULL OR message_count > 0);
      RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
    END IF;
    
    -- New Architect: check 100/hr cooldown first
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

    -- Then check 300/day cap
    v_daily_limit := 300;
    INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
    VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT daily_messages, last_message_date INTO v_daily_messages, v_last_date
    FROM free_user_limits WHERE user_id = p_user_id;

    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
      v_daily_messages := 0;
    END IF;

    RETURN json_build_object(
      'can_send', COALESCE(v_daily_messages, 0) < v_daily_limit,
      'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_messages, 0)),
      'cooldown_ends_at', null,
      'daily_limit', v_daily_limit,
      'cooldown_remaining', GREATEST(0, 100 - COALESCE(v_cooldown.message_count, 0))
    );
  END IF;

  -- Legacy Anchoring (old $14.99 plan): unlimited, use 100/hr cooldown
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

  -- Free users use existing limit system
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Determine daily limit based on product
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

  RETURN json_build_object(
    'can_send', COALESCE(v_daily_messages, 0) < v_daily_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_messages, 0)),
    'cooldown_ends_at', null,
    'daily_limit', v_daily_limit
  );
END;
$function$;

-- Update increment_chat_cooldown to include new Architect users
CREATE OR REPLACE FUNCTION public.increment_chat_cooldown(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_product_id text;
  v_new_count integer;
  v_cooldown_ends timestamp with time zone;
  v_legacy_unlimited boolean;
BEGIN
  -- Admins bypass
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- Check subscription and product
  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited
  FROM profiles WHERE id = p_user_id;

  -- Source grant bypass
  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- Architect: legacy unlimited bypass, new users use cooldown
  IF v_product_id = 'prod_Tt8qVh88c2WQld' AND v_legacy_unlimited THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- Free users don't use this system
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- All non-legacy subscribed users: increment cooldown
  -- This now includes new Architect + Legacy Anchoring
  INSERT INTO chat_cooldowns (user_id, message_count, period_started_at)
  VALUES (p_user_id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE chat_cooldowns
  SET message_count = message_count + 1, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING message_count INTO v_new_count;

  -- If hit 100, start cooldown
  IF v_new_count >= 100 THEN
    v_cooldown_ends := now() + INTERVAL '1 hour';
    UPDATE chat_cooldowns
    SET cooldown_started_at = now(), updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
      'message_count', v_new_count,
      'remaining', 0,
      'cooldown_started', true,
      'cooldown_ends_at', v_cooldown_ends
    );
  END IF;

  RETURN json_build_object(
    'message_count', v_new_count,
    'remaining', 100 - v_new_count,
    'cooldown_started', false
  );
END;
$function$;

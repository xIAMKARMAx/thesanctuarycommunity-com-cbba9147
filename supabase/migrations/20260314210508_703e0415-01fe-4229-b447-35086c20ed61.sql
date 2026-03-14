
-- Add monthly message tracking columns
ALTER TABLE public.free_user_limits 
ADD COLUMN IF NOT EXISTS monthly_messages integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month text NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');

-- Update can_send_message with new strict limits + monthly caps
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
  v_monthly_messages integer;
  v_last_date date;
  v_current_month text;
  v_stored_month text;
  v_daily_limit integer;
  v_monthly_limit integer;
  v_legacy_unlimited boolean;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN RETURN true; END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited
  FROM profiles WHERE id = p_user_id;
  
  IF v_product_id = 'source_grant' THEN RETURN true; END IF;

  -- Ensure limits row exists
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0, 0, to_char(CURRENT_DATE, 'YYYY-MM'))
  ON CONFLICT (user_id) DO NOTHING;

  IF v_is_subscribed THEN
    -- Determine daily and monthly limits by tier
    IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
      -- New Earth: 500/day, 8000/month
      v_daily_limit := 500; v_monthly_limit := 8000;
    ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
      -- Architect: 300/day, 5000/month
      v_daily_limit := 300; v_monthly_limit := 5000;
    ELSIF v_product_id = 'prod_U3xV1AfsrdaJTz' THEN
      -- New Anchoring: 100/day, 2000/month
      v_daily_limit := 100; v_monthly_limit := 2000;
    ELSIF v_product_id = 'prod_TgZlr0QLYQPqEn' THEN
      -- Legacy Anchoring: 100/day, 2000/month
      v_daily_limit := 100; v_monthly_limit := 2000;
    ELSIF v_product_id = 'prod_U3xVsHqEFcsR2V' THEN
      -- New Awakening: 50/day, 1000/month
      v_daily_limit := 50; v_monthly_limit := 1000;
    ELSIF v_product_id = 'prod_TtTdHv6WE0qozS' THEN
      -- Legacy Awakening: 50/day, 1000/month
      v_daily_limit := 50; v_monthly_limit := 1000;
    ELSE
      v_daily_limit := 50; v_monthly_limit := 1000;
    END IF;

    SELECT daily_messages, last_message_date, monthly_messages, current_month
    INTO v_daily_messages, v_last_date, v_monthly_messages, v_stored_month
    FROM free_user_limits WHERE user_id = p_user_id;

    v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');

    -- Reset daily if new day
    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
      v_daily_messages := 0;
    END IF;

    -- Reset monthly if new month
    IF v_stored_month IS NULL OR v_stored_month != v_current_month THEN
      v_monthly_messages := 0;
    END IF;

    RETURN COALESCE(v_daily_messages, 0) < v_daily_limit AND COALESCE(v_monthly_messages, 0) < v_monthly_limit;
  END IF;

  -- FREE USERS: 15 messages TOTAL
  SELECT total_messages INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_total_messages, 0) < 15;
END;
$function$;

-- Update increment_message_count to track monthly
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_last_date date;
  v_current_month text;
BEGIN
  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');

  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 1, CURRENT_DATE, CURRENT_DATE, 1, 1, v_current_month)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    daily_messages = CASE 
      WHEN free_user_limits.last_message_date < CURRENT_DATE THEN 1 
      ELSE free_user_limits.daily_messages + 1 
    END,
    last_message_date = CURRENT_DATE,
    total_messages = free_user_limits.total_messages + 1,
    monthly_messages = CASE
      WHEN free_user_limits.current_month != v_current_month THEN 1
      ELSE free_user_limits.monthly_messages + 1
    END,
    current_month = v_current_month,
    trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE),
    updated_at = now()
  RETURNING daily_messages INTO v_count;
  
  RETURN v_count;
END;
$function$;

-- Update can_send_chat_message to return new limits info
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
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_messages integer;
  v_monthly_messages integer;
  v_last_date date;
  v_stored_month text;
  v_current_month text;
  v_legacy_unlimited boolean;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_ends_at', null);
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited
  FROM profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Ensure row exists
  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, 0, 0, v_current_month)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT COALESCE(v_is_subscribed, false) THEN
    -- Free user
    DECLARE v_total integer;
    BEGIN
      SELECT total_messages INTO v_total FROM free_user_limits WHERE user_id = p_user_id;
      RETURN json_build_object('can_send', COALESCE(v_total, 0) < 15, 'remaining', GREATEST(0, 15 - COALESCE(v_total, 0)), 'monthly_remaining', -1, 'cooldown_ends_at', null, 'is_free', true);
    END;
  END IF;

  -- Determine limits
  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    v_daily_limit := 500; v_monthly_limit := 8000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    v_daily_limit := 300; v_monthly_limit := 5000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN
    v_daily_limit := 100; v_monthly_limit := 2000;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN
    v_daily_limit := 50; v_monthly_limit := 1000;
  ELSE
    v_daily_limit := 50; v_monthly_limit := 1000;
  END IF;

  SELECT daily_messages, last_message_date, monthly_messages, current_month
  INTO v_daily_messages, v_last_date, v_monthly_messages, v_stored_month
  FROM free_user_limits WHERE user_id = p_user_id;

  -- Reset daily if new day
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    v_daily_messages := 0;
  END IF;

  -- Reset monthly if new month
  IF v_stored_month IS NULL OR v_stored_month != v_current_month THEN
    v_monthly_messages := 0;
  END IF;

  RETURN json_build_object(
    'can_send', COALESCE(v_daily_messages, 0) < v_daily_limit AND COALESCE(v_monthly_messages, 0) < v_monthly_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_messages, 0)),
    'daily_limit', v_daily_limit,
    'monthly_remaining', GREATEST(0, v_monthly_limit - COALESCE(v_monthly_messages, 0)),
    'monthly_limit', v_monthly_limit,
    'cooldown_ends_at', null,
    'in_cooldown', false
  );
END;
$function$;

-- Update increment_chat_cooldown - no more cooldown system, just strict daily/monthly limits
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
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_count integer;
  v_monthly_count integer;
  v_current_month text;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false);
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id
  INTO v_is_subscribed, v_product_id
  FROM profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false);
  END IF;

  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false);
  END IF;

  -- Determine limits
  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    v_daily_limit := 500; v_monthly_limit := 8000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    v_daily_limit := 300; v_monthly_limit := 5000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN
    v_daily_limit := 100; v_monthly_limit := 2000;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN
    v_daily_limit := 50; v_monthly_limit := 1000;
  ELSE
    v_daily_limit := 50; v_monthly_limit := 1000;
  END IF;

  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');

  -- Get current counts after increment (increment_message_count should be called first)
  SELECT daily_messages, monthly_messages INTO v_daily_count, v_monthly_count
  FROM free_user_limits WHERE user_id = p_user_id;

  -- Reset if needed
  DECLARE v_last_date date; v_stored_month text;
  BEGIN
    SELECT last_message_date, current_month INTO v_last_date, v_stored_month
    FROM free_user_limits WHERE user_id = p_user_id;
    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN v_daily_count := 0; END IF;
    IF v_stored_month IS NULL OR v_stored_month != v_current_month THEN v_monthly_count := 0; END IF;
  END;

  RETURN json_build_object(
    'message_count', COALESCE(v_daily_count, 0),
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_count, 0)),
    'monthly_remaining', GREATEST(0, v_monthly_limit - COALESCE(v_monthly_count, 0)),
    'monthly_limit', v_monthly_limit,
    'daily_limit', v_daily_limit,
    'cooldown_started', false
  );
END;
$function$;

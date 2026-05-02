-- Add trial messages column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_trial_messages_remaining integer NOT NULL DEFAULT 5;

-- Backfill: existing users who signed up in last 7 days get 5; older users get 0
UPDATE public.profiles
SET free_trial_messages_remaining = CASE
  WHEN created_at >= (TIMESTAMP '2026-05-02 00:00:00' - INTERVAL '7 days') THEN 5
  ELSE 0
END;

-- Update can_send_chat_message to allow trial messages for non-subscribed users
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
  v_daily_override integer;
  v_monthly_override integer;
  v_trial_remaining integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_ends_at', null);
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false),
         daily_message_override, monthly_message_override,
         COALESCE(free_trial_messages_remaining, 0)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited, v_daily_override, v_monthly_override, v_trial_remaining
  FROM profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_ends_at', null);
  END IF;

  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, 0, 0, v_current_month)
  ON CONFLICT (user_id) DO NOTHING;

  -- Non-subscribed users: allow free trial messages if any remain
  IF NOT COALESCE(v_is_subscribed, false) THEN
    IF v_trial_remaining > 0 THEN
      RETURN json_build_object(
        'can_send', true,
        'remaining', v_trial_remaining,
        'monthly_remaining', v_trial_remaining,
        'cooldown_ends_at', null,
        'is_trial', true
      );
    END IF;
    RETURN json_build_object(
      'can_send', false,
      'remaining', 0,
      'monthly_remaining', 0,
      'cooldown_ends_at', null,
      'reason', 'subscription_required'
    );
  END IF;

  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    v_daily_limit := 350; v_monthly_limit := 5000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    v_daily_limit := 100; v_monthly_limit := 2000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN
    v_daily_limit := 80; v_monthly_limit := 1600;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN
    v_daily_limit := 50; v_monthly_limit := 1000;
  ELSE
    v_daily_limit := 50; v_monthly_limit := 1000;
  END IF;

  IF v_daily_override IS NOT NULL THEN v_daily_limit := v_daily_override; END IF;
  IF v_monthly_override IS NOT NULL THEN v_monthly_limit := v_monthly_override; END IF;

  SELECT daily_messages, last_message_date, monthly_messages, current_month
  INTO v_daily_messages, v_last_date, v_monthly_messages, v_stored_month
  FROM free_user_limits WHERE user_id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN v_daily_messages := 0; END IF;
  IF v_stored_month IS NULL OR v_stored_month != v_current_month THEN v_monthly_messages := 0; END IF;

  RETURN json_build_object(
    'can_send', COALESCE(v_daily_messages, 0) < v_daily_limit AND COALESCE(v_monthly_messages, 0) < v_monthly_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_messages, 0)),
    'monthly_remaining', GREATEST(0, v_monthly_limit - COALESCE(v_monthly_messages, 0)),
    'cooldown_ends_at', null
  );
END;
$function$;

-- Update can_send_message (boolean variant) likewise
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_product_id text;
  v_daily_messages integer;
  v_monthly_messages integer;
  v_last_date date;
  v_current_month text;
  v_stored_month text;
  v_daily_limit integer;
  v_monthly_limit integer;
  v_legacy_unlimited boolean;
  v_daily_override integer;
  v_monthly_override integer;
  v_trial_remaining integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN RETURN true; END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, COALESCE(legacy_unlimited, false),
         daily_message_override, monthly_message_override,
         COALESCE(free_trial_messages_remaining, 0)
  INTO v_is_subscribed, v_product_id, v_legacy_unlimited, v_daily_override, v_monthly_override, v_trial_remaining
  FROM profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN RETURN true; END IF;

  -- Non-subscribed users: trial messages allow sending
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN v_trial_remaining > 0;
  END IF;

  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0, 0, to_char(CURRENT_DATE, 'YYYY-MM'))
  ON CONFLICT (user_id) DO NOTHING;

  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    v_daily_limit := 350; v_monthly_limit := 5000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    v_daily_limit := 100; v_monthly_limit := 2000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN
    v_daily_limit := 80; v_monthly_limit := 1600;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN
    v_daily_limit := 50; v_monthly_limit := 1000;
  ELSE
    v_daily_limit := 50; v_monthly_limit := 1000;
  END IF;

  IF v_daily_override IS NOT NULL THEN v_daily_limit := v_daily_override; END IF;
  IF v_monthly_override IS NOT NULL THEN v_monthly_limit := v_monthly_override; END IF;

  SELECT daily_messages, last_message_date, monthly_messages, current_month
  INTO v_daily_messages, v_last_date, v_monthly_messages, v_stored_month
  FROM free_user_limits WHERE user_id = p_user_id;

  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN v_daily_messages := 0; END IF;
  IF v_stored_month IS NULL OR v_stored_month != v_current_month THEN v_monthly_messages := 0; END IF;

  RETURN COALESCE(v_daily_messages, 0) < v_daily_limit AND COALESCE(v_monthly_messages, 0) < v_monthly_limit;
END;
$function$;

-- Update increment_message_count to decrement trial messages for non-subscribed users
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_current_month text;
  v_is_subscribed boolean;
  v_product_id text;
BEGIN
  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');

  SELECT (subscription_status = 'active'), subscription_product_id
  INTO v_is_subscribed, v_product_id
  FROM profiles WHERE id = p_user_id;

  -- For non-subscribed (trial) users, decrement trial counter and return remaining
  IF NOT COALESCE(v_is_subscribed, false) AND v_product_id IS DISTINCT FROM 'source_grant' THEN
    UPDATE profiles
    SET free_trial_messages_remaining = GREATEST(0, COALESCE(free_trial_messages_remaining, 0) - 1)
    WHERE id = p_user_id
    RETURNING free_trial_messages_remaining INTO v_count;
    RETURN COALESCE(v_count, 0);
  END IF;

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
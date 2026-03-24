-- Fix increment_chat_cooldown to also track free user messages
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
  v_daily_override integer;
  v_monthly_override integer;
  v_total_messages integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false);
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, daily_message_override, monthly_message_override
  INTO v_is_subscribed, v_product_id, v_daily_override, v_monthly_override
  FROM profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false);
  END IF;

  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');

  -- Ensure free_user_limits row exists
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, 0, 0, v_current_month)
  ON CONFLICT (user_id) DO NOTHING;

  -- FREE / UNSUBSCRIBED users: increment total_messages and enforce 10-message lifetime cap
  IF NOT COALESCE(v_is_subscribed, false) THEN
    UPDATE free_user_limits
    SET total_messages = total_messages + 1,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING total_messages INTO v_total_messages;

    RETURN json_build_object(
      'message_count', COALESCE(v_total_messages, 0),
      'remaining', GREATEST(0, 10 - COALESCE(v_total_messages, 0)),
      'monthly_remaining', -1,
      'cooldown_started', false
    );
  END IF;

  -- SUBSCRIBED users: determine limits by product
  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    v_daily_limit := 350; v_monthly_limit := 5000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    v_daily_limit := 100; v_monthly_limit := 2000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN
    v_daily_limit := 80; v_monthly_limit := 1600;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN
    v_daily_limit := 50; v_monthly_limit := 1000;
  ELSE
    -- Catch-all for legacy/unrecognized product IDs - default to Awakening limits
    v_daily_limit := 50; v_monthly_limit := 1000;
  END IF;

  IF v_daily_override IS NOT NULL THEN v_daily_limit := v_daily_override; END IF;
  IF v_monthly_override IS NOT NULL THEN v_monthly_limit := v_monthly_override; END IF;

  -- Increment: reset daily if new day, reset monthly if new month
  UPDATE free_user_limits
  SET
    daily_messages = CASE
      WHEN last_message_date IS NULL OR last_message_date < CURRENT_DATE THEN 1
      ELSE daily_messages + 1
    END,
    monthly_messages = CASE
      WHEN current_month IS NULL OR current_month != v_current_month THEN 1
      ELSE monthly_messages + 1
    END,
    last_message_date = CURRENT_DATE,
    current_month = v_current_month,
    total_messages = total_messages + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING daily_messages, monthly_messages INTO v_daily_count, v_monthly_count;

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
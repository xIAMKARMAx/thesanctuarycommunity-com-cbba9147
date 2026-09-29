CREATE OR REPLACE FUNCTION public.reserve_chat_message(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_check json;
  v_result json;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('can_send', false, 'reason', 'invalid_user');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':chat-message-limit', 0));
  v_check := public.can_send_chat_message(p_user_id);

  IF NOT COALESCE((v_check->>'can_send')::boolean, false) THEN
    RETURN v_check;
  END IF;

  v_result := public.increment_chat_cooldown(p_user_id);
  RETURN json_build_object(
    'can_send', true,
    'reserved', true,
    'remaining', COALESCE((v_result->>'remaining')::integer, -1),
    'monthly_remaining', COALESCE((v_result->>'monthly_remaining')::integer, -1),
    'daily_limit', CASE WHEN v_result->>'daily_limit' IS NULL THEN NULL ELSE (v_result->>'daily_limit')::integer END,
    'monthly_limit', CASE WHEN v_result->>'monthly_limit' IS NULL THEN NULL ELSE (v_result->>'monthly_limit')::integer END,
    'is_free_tier', COALESCE((v_result->>'is_free_tier')::boolean, false)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_chat_message(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_product_id text;
  v_current_month text := to_char(CURRENT_DATE, 'YYYY-MM');
  v_daily integer := 0;
  v_monthly integer := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('released', false);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':chat-message-limit', 0));
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  SELECT (subscription_status = 'active'), subscription_product_id
    INTO v_is_subscribed, v_product_id
  FROM public.profiles WHERE id = p_user_id;

  IF COALESCE(v_is_admin, false) OR v_product_id = 'source_grant' THEN
    RETURN json_build_object('released', false, 'exempt', true);
  END IF;

  IF NOT COALESCE(v_is_subscribed, false) THEN
    UPDATE public.free_message_usage
       SET messages_used = GREATEST(0, messages_used - 1), updated_at = now()
     WHERE user_id = p_user_id
       AND window_start <= now()
       AND window_start + interval '30 days' > now()
     RETURNING messages_used INTO v_daily;
    RETURN json_build_object('released', FOUND, 'remaining_used', COALESCE(v_daily, 0));
  END IF;

  UPDATE public.free_user_limits
     SET daily_messages = CASE WHEN last_message_date = CURRENT_DATE THEN GREATEST(0, daily_messages - 1) ELSE daily_messages END,
         monthly_messages = CASE WHEN current_month = v_current_month THEN GREATEST(0, monthly_messages - 1) ELSE monthly_messages END,
         total_messages = GREATEST(0, total_messages - 1),
         updated_at = now()
   WHERE user_id = p_user_id
   RETURNING daily_messages, monthly_messages INTO v_daily, v_monthly;

  RETURN json_build_object('released', FOUND, 'daily_messages', COALESCE(v_daily, 0), 'monthly_messages', COALESCE(v_monthly, 0));
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_chat_message(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_chat_message(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_chat_message(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_chat_message(uuid) TO service_role;

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
  v_daily_override integer;
  v_monthly_override integer;
  v_free_result jsonb;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_ends_at', null);
  END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, daily_message_override, monthly_message_override
    INTO v_is_subscribed, v_product_id, v_daily_override, v_monthly_override
  FROM public.profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_ends_at', null);
  END IF;

  IF NOT COALESCE(v_is_subscribed, false) THEN
    v_free_result := public.can_send_free_message(p_user_id);
    RETURN json_build_object('can_send', (v_free_result->>'can_send')::boolean, 'remaining', (v_free_result->>'remaining')::integer, 'monthly_remaining', (v_free_result->>'remaining')::integer, 'cooldown_ends_at', null, 'is_free_tier', true, 'window_resets_at', v_free_result->>'window_resets_at', 'reason', CASE WHEN (v_free_result->>'can_send')::boolean THEN null ELSE 'free_window_exhausted' END);
  END IF;

  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  INSERT INTO public.free_user_limits (user_id, daily_messages, last_message_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, 0, 0, v_current_month)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    v_daily_limit := 300; v_monthly_limit := 6000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    v_daily_limit := 200; v_monthly_limit := 4000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN
    v_daily_limit := 125; v_monthly_limit := 2500;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN
    v_daily_limit := 75; v_monthly_limit := 1500;
  ELSE
    v_daily_limit := 75; v_monthly_limit := 1500;
  END IF;

  IF v_daily_override IS NOT NULL THEN v_daily_limit := v_daily_override; END IF;
  IF v_monthly_override IS NOT NULL THEN v_monthly_limit := v_monthly_override; END IF;

  SELECT daily_messages, last_message_date, monthly_messages, current_month
    INTO v_daily_messages, v_last_date, v_monthly_messages, v_stored_month
  FROM public.free_user_limits WHERE user_id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN v_daily_messages := 0; END IF;
  IF v_stored_month IS NULL OR v_stored_month != v_current_month THEN v_monthly_messages := 0; END IF;

  RETURN json_build_object('can_send', COALESCE(v_daily_messages, 0) < v_daily_limit AND COALESCE(v_monthly_messages, 0) < v_monthly_limit, 'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_messages, 0)), 'monthly_remaining', GREATEST(0, v_monthly_limit - COALESCE(v_monthly_messages, 0)), 'daily_limit', v_daily_limit, 'monthly_limit', v_monthly_limit, 'cooldown_ends_at', null);
END;
$function$;

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
  v_free_result jsonb;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false); END IF;

  SELECT (subscription_status = 'active'), subscription_product_id, daily_message_override, monthly_message_override
    INTO v_is_subscribed, v_product_id, v_daily_override, v_monthly_override
  FROM public.profiles WHERE id = p_user_id;

  IF v_product_id = 'source_grant' THEN RETURN json_build_object('message_count', 0, 'remaining', -1, 'monthly_remaining', -1, 'cooldown_started', false); END IF;
  IF NOT COALESCE(v_is_subscribed, false) THEN
    v_free_result := public.increment_free_message(p_user_id);
    RETURN json_build_object('message_count', (v_free_result->>'used')::integer, 'remaining', (v_free_result->>'remaining')::integer, 'monthly_remaining', (v_free_result->>'remaining')::integer, 'cooldown_started', false, 'is_free_tier', true, 'window_resets_at', v_free_result->>'window_resets_at');
  END IF;

  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  INSERT INTO public.free_user_limits (user_id, daily_messages, last_message_date, total_messages, monthly_messages, current_month)
  VALUES (p_user_id, 0, CURRENT_DATE, 0, 0, v_current_month)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN v_daily_limit := 300; v_monthly_limit := 6000;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN v_daily_limit := 200; v_monthly_limit := 4000;
  ELSIF v_product_id IN ('prod_U3xV1AfsrdaJTz', 'prod_TgZlr0QLYQPqEn') THEN v_daily_limit := 125; v_monthly_limit := 2500;
  ELSIF v_product_id IN ('prod_U3xVsHqEFcsR2V', 'prod_TtTdHv6WE0qozS') THEN v_daily_limit := 75; v_monthly_limit := 1500;
  ELSE v_daily_limit := 75; v_monthly_limit := 1500;
  END IF;

  IF v_daily_override IS NOT NULL THEN v_daily_limit := v_daily_override; END IF;
  IF v_monthly_override IS NOT NULL THEN v_monthly_limit := v_monthly_override; END IF;

  UPDATE public.free_user_limits
     SET daily_messages = CASE WHEN last_message_date IS NULL OR last_message_date < CURRENT_DATE THEN 1 ELSE daily_messages + 1 END,
         monthly_messages = CASE WHEN current_month IS NULL OR current_month != v_current_month THEN 1 ELSE monthly_messages + 1 END,
         last_message_date = CURRENT_DATE,
         current_month = v_current_month,
         total_messages = total_messages + 1,
         updated_at = now()
   WHERE user_id = p_user_id
   RETURNING daily_messages, monthly_messages INTO v_daily_count, v_monthly_count;

  RETURN json_build_object('message_count', COALESCE(v_daily_count, 0), 'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_count, 0)), 'monthly_remaining', GREATEST(0, v_monthly_limit - COALESCE(v_monthly_count, 0)), 'monthly_limit', v_monthly_limit, 'daily_limit', v_daily_limit, 'cooldown_started', false);
END;
$function$;
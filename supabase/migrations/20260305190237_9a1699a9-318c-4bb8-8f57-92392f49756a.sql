
CREATE OR REPLACE FUNCTION public.can_create_art(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_has_addon boolean;
  v_daily_count integer;
  v_daily_limit integer;
  v_product_id text;
  v_is_subscribed boolean;
BEGIN
  -- Admins unlimited
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_create', true, 'remaining', -1, 'daily_limit', -1);
  END IF;

  -- Get subscription info
  SELECT subscription_product_id, (subscription_status = 'active')
  INTO v_product_id, v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  -- Check art studio add-on
  SELECT COALESCE(is_active, false) INTO v_has_addon
  FROM art_studio_subscriptions WHERE user_id = p_user_id;

  -- Determine daily limit based on tier
  IF v_product_id = 'source_grant' THEN
    RETURN json_build_object('can_create', true, 'remaining', -1, 'daily_limit', -1);
  ELSIF v_product_id = 'prod_U5jdDVZhQFGQWv' THEN
    -- New Earth: unlimited
    RETURN json_build_object('can_create', true, 'remaining', -1, 'daily_limit', -1);
  ELSIF v_product_id = 'prod_U3xV1AfsrdaJTz' OR v_product_id = 'prod_TgZlr0QLYQPqEn' THEN
    -- Anchoring (new + legacy): 10/day
    v_daily_limit := 10;
  ELSIF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    -- Architect: 5/day
    v_daily_limit := 5;
  ELSIF v_product_id = 'prod_U3xVsHqEFcsR2V' OR v_product_id = 'prod_TtTdHv6WE0qozS' THEN
    -- Awakening (new + legacy): 3/day
    v_daily_limit := 3;
  ELSIF COALESCE(v_has_addon, false) THEN
    -- Art studio add-on only: 5/day
    v_daily_limit := 5;
  ELSE
    RETURN json_build_object('can_create', false, 'remaining', 0, 'daily_limit', 0, 'reason', 'no_access');
  END IF;

  -- Add-on bonus: +5 to daily limit if they also have the add-on
  IF COALESCE(v_has_addon, false) AND v_daily_limit > 0 THEN
    v_daily_limit := v_daily_limit + 5;
  END IF;

  -- Get today's usage
  INSERT INTO art_studio_usage (user_id, usage_date, creation_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT creation_count INTO v_daily_count
  FROM art_studio_usage WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'can_create', COALESCE(v_daily_count, 0) < v_daily_limit,
    'remaining', GREATEST(0, v_daily_limit - COALESCE(v_daily_count, 0)),
    'daily_limit', v_daily_limit,
    'has_addon', COALESCE(v_has_addon, false)
  );
END;
$function$;

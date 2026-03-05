CREATE OR REPLACE FUNCTION public.can_generate_image(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_product_id text;
  v_daily_count integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN RETURN true; END IF;

  SELECT (subscription_status = 'active'), subscription_product_id
  INTO v_is_subscribed, v_product_id
  FROM profiles WHERE id = p_user_id;

  IF NOT COALESCE(v_is_subscribed, false) THEN RETURN false; END IF;

  IF v_product_id IN ('source_grant', 'prod_U5jdDVZhQFGQWv') THEN RETURN true; END IF;

  IF v_product_id = 'prod_Tt8qVh88c2WQld' THEN
    SELECT COALESCE(SUM(count), 0) INTO v_daily_count
    FROM image_generation_usage
    WHERE user_id = p_user_id AND generation_date = CURRENT_DATE;
    RETURN v_daily_count < 5;
  END IF;

  SELECT COALESCE(SUM(count), 0) INTO v_daily_count
  FROM image_generation_usage
  WHERE user_id = p_user_id AND generation_date = CURRENT_DATE;
  RETURN v_daily_count < 10;
END;
$function$
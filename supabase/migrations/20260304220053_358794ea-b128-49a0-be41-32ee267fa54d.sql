
-- Update purge_old_messages to handle Architect tier with 30-day retention
CREATE OR REPLACE FUNCTION public.purge_old_messages()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_standard integer;
  v_deleted_architect integer;
BEGIN
  -- Purge messages older than 60 days for non-Architect users (except pinned)
  DELETE FROM public.messages m
  WHERE m.created_at < now() - INTERVAL '60 days'
    AND m.is_pinned = false
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = m.user_id
        AND p.subscription_product_id = 'prod_Tt8qVh88c2WQld'
    );
  GET DIAGNOSTICS v_deleted_standard = ROW_COUNT;

  -- Purge messages older than 30 days for Architect users (except pinned)
  DELETE FROM public.messages m
  WHERE m.created_at < now() - INTERVAL '30 days'
    AND m.is_pinned = false
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = m.user_id
        AND p.subscription_product_id = 'prod_Tt8qVh88c2WQld'
    );
  GET DIAGNOSTICS v_deleted_architect = ROW_COUNT;

  RETURN json_build_object(
    'deleted_standard', v_deleted_standard,
    'deleted_architect', v_deleted_architect,
    'total_deleted', v_deleted_standard + v_deleted_architect
  );
END;
$function$;

-- Function to count pinned messages for a user
CREATE OR REPLACE FUNCTION public.count_pinned_messages(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE user_id = p_user_id
    AND is_pinned = true
$function$;

-- Function to toggle pin with limit check
CREATE OR REPLACE FUNCTION public.toggle_pin_message(p_user_id uuid, p_message_id uuid, p_pin boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_pinned integer;
  v_max_pins integer := 30;
  v_product_id text;
BEGIN
  -- Get user's product
  SELECT subscription_product_id INTO v_product_id
  FROM profiles WHERE id = p_user_id;

  -- Only Architect tier has the 30-pin limit; others use default 60-day retention with unlimited pins
  -- Source grant and admin also unlimited
  IF v_product_id NOT IN ('prod_Tt8qVh88c2WQld') OR v_product_id = 'source_grant' THEN
    v_max_pins := 999999; -- effectively unlimited
  END IF;

  IF p_pin THEN
    -- Check pin limit
    SELECT COUNT(*)::integer INTO v_current_pinned
    FROM messages WHERE user_id = p_user_id AND is_pinned = true;

    IF v_current_pinned >= v_max_pins THEN
      RETURN json_build_object('success', false, 'reason', 'pin_limit_reached', 'current_pinned', v_current_pinned, 'max_pins', v_max_pins);
    END IF;
  END IF;

  -- Toggle the pin
  UPDATE messages SET is_pinned = p_pin WHERE id = p_message_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'is_pinned', p_pin);
END;
$function$;

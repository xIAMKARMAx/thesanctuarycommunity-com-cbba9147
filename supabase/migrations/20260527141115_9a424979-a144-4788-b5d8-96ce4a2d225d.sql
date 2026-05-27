
-- Lower pin/save limit to 50 for everyone except admins & source_grant
CREATE OR REPLACE FUNCTION public.toggle_pin_message(p_user_id uuid, p_message_id uuid, p_pin boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_pinned integer;
  v_max_pins integer := 50;
  v_product_id text;
  v_is_admin boolean;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  SELECT subscription_product_id INTO v_product_id FROM profiles WHERE id = p_user_id;

  -- Admins & source_grant: unlimited
  IF v_is_admin OR v_product_id = 'source_grant' THEN
    v_max_pins := 999999;
  END IF;

  IF p_pin THEN
    SELECT COUNT(*)::integer INTO v_current_pinned
    FROM messages WHERE user_id = p_user_id AND is_pinned = true;

    IF v_current_pinned >= v_max_pins THEN
      RETURN json_build_object('success', false, 'reason', 'pin_limit_reached', 'current_pinned', v_current_pinned, 'max_pins', v_max_pins);
    END IF;
  END IF;

  UPDATE messages SET is_pinned = p_pin WHERE id = p_message_id AND user_id = p_user_id;
  RETURN json_build_object('success', true, 'is_pinned', p_pin);
END;
$function$;

-- Auto-delete unpinned messages after 30 days (was 60); exempt Karma & Jakob
CREATE OR REPLACE FUNCTION public.purge_old_messages()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted integer;
  v_exempt_users uuid[] := ARRAY[
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid,
    '1af51c0a-4f6e-469d-b31f-8972d1687655'::uuid
  ];
BEGIN
  DELETE FROM public.messages m
  WHERE m.created_at < now() - INTERVAL '30 days'
    AND m.is_pinned = false
    AND m.user_id != ALL(v_exempt_users);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN json_build_object('total_deleted', v_deleted);
END;
$function$;

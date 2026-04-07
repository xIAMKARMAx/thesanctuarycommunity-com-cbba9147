
CREATE OR REPLACE FUNCTION public.purge_old_messages()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_standard integer;
  v_deleted_architect integer;
  v_exempt_users uuid[] := ARRAY[
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    '1af51c0a-4f6e-469d-b31f-8972d1687655'::uuid
  ];
BEGIN
  -- Purge messages older than 60 days for non-Architect users (except pinned and exempt users)
  DELETE FROM public.messages m
  WHERE m.created_at < now() - INTERVAL '60 days'
    AND m.is_pinned = false
    AND m.user_id != ALL(v_exempt_users)
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = m.user_id
        AND p.subscription_product_id = 'prod_Tt8qVh88c2WQld'
    );
  GET DIAGNOSTICS v_deleted_standard = ROW_COUNT;

  -- Purge messages older than 30 days for Architect users (except pinned and exempt users)
  DELETE FROM public.messages m
  WHERE m.created_at < now() - INTERVAL '30 days'
    AND m.is_pinned = false
    AND m.user_id != ALL(v_exempt_users)
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

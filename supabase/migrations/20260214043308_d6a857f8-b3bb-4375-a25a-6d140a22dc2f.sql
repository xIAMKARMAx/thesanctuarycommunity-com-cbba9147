
-- Update can_start_attunement to use 3 per day instead of 5 per month
CREATE OR REPLACE FUNCTION public.can_start_attunement(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_sessions_today integer;
BEGIN
  -- Admins have unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Count sessions today (last 24 hours)
  SELECT COUNT(*) INTO v_sessions_today
  FROM attunement_sessions
  WHERE user_id = p_user_id
    AND created_at >= (NOW() - INTERVAL '24 hours');

  -- Users get 3 sessions per 24 hours
  RETURN v_sessions_today < 3;
END;
$$;

-- Update get_attunement_stats to return daily stats
CREATE OR REPLACE FUNCTION public.get_attunement_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_sessions_today integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;

  SELECT COUNT(*) INTO v_sessions_today
  FROM attunement_sessions
  WHERE user_id = p_user_id
    AND created_at >= (NOW() - INTERVAL '24 hours');

  RETURN json_build_object(
    'is_admin', v_is_admin,
    'sessions_today', v_sessions_today,
    'sessions_remaining', CASE WHEN v_is_admin THEN 999 ELSE GREATEST(0, 3 - v_sessions_today) END,
    'max_sessions', 3
  );
END;
$$;

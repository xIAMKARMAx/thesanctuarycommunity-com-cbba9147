-- Function to check if a user can start a voice call
CREATE OR REPLACE FUNCTION public.can_start_voice_call(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_calls_today integer;
BEGIN
  -- Admins have unlimited calls
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Count calls started today
  SELECT COUNT(*) INTO v_calls_today
  FROM voice_call_history
  WHERE user_id = p_user_id
    AND call_started_at::date = CURRENT_DATE;

  -- Pro users: 3 calls per day
  RETURN v_calls_today < 3;
END;
$function$;

-- Function to get remaining voice calls for today
CREATE OR REPLACE FUNCTION public.get_voice_call_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_calls_today integer;
  v_total_seconds_today integer;
BEGIN
  -- Check if admin
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  
  -- Count calls and total duration today
  SELECT 
    COUNT(*),
    COALESCE(SUM(call_duration_seconds), 0)
  INTO v_calls_today, v_total_seconds_today
  FROM voice_call_history
  WHERE user_id = p_user_id
    AND call_started_at::date = CURRENT_DATE;

  RETURN json_build_object(
    'is_admin', v_is_admin,
    'calls_today', v_calls_today,
    'calls_remaining', CASE WHEN v_is_admin THEN 999 ELSE GREATEST(0, 3 - v_calls_today) END,
    'total_seconds_today', v_total_seconds_today,
    'max_call_seconds', 3600
  );
END;
$function$;

-- RLS policy for voice_call_history if not exists
ALTER TABLE voice_call_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own call history" ON voice_call_history;
CREATE POLICY "Users can view their own call history" 
ON voice_call_history FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own call history" ON voice_call_history;
CREATE POLICY "Users can insert their own call history" 
ON voice_call_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own call history" ON voice_call_history;
CREATE POLICY "Users can update their own call history" 
ON voice_call_history FOR UPDATE 
USING (auth.uid() = user_id);
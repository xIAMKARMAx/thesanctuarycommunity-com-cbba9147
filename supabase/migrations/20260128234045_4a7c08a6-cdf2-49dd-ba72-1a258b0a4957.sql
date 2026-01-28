-- Add columns to track AI import and bonus messages
ALTER TABLE public.free_user_limits 
ADD COLUMN IF NOT EXISTS ai_imported boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS import_bonus_claimed boolean DEFAULT false;

-- Update the can_send_message function to use new limits
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_subscribed boolean;
  v_is_admin boolean;
  v_daily_messages integer;
  v_last_message_date date;
  v_total_messages integer;
  v_ai_imported boolean;
  v_message_limit integer;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription - unlimited messages
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages, ai_imported, import_bonus_claimed)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0, false, false)
  ON CONFLICT (user_id) DO UPDATE 
  SET trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE);
  
  -- Get current limits including AI import status
  SELECT total_messages, COALESCE(ai_imported, false)
  INTO v_total_messages, v_ai_imported
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Calculate message limit: 10 base + 10 bonus if AI imported = 20 max
  IF v_ai_imported THEN
    v_message_limit := 20;
  ELSE
    v_message_limit := 10;
  END IF;
  
  -- Check total messages against limit
  RETURN COALESCE(v_total_messages, 0) < v_message_limit;
END;
$function$;

-- Create function to claim import bonus
CREATE OR REPLACE FUNCTION public.claim_import_bonus(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_already_imported boolean;
  v_is_subscribed boolean;
BEGIN
  -- Check subscription - subscribers don't need bonus
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN json_build_object('success', false, 'reason', 'already_subscribed');
  END IF;
  
  -- Check if already imported
  SELECT COALESCE(ai_imported, false) INTO v_already_imported
  FROM free_user_limits WHERE user_id = p_user_id;
  
  IF v_already_imported THEN
    RETURN json_build_object('success', false, 'reason', 'already_claimed');
  END IF;
  
  -- Claim the bonus
  INSERT INTO free_user_limits (user_id, ai_imported, import_bonus_claimed)
  VALUES (p_user_id, true, true)
  ON CONFLICT (user_id) DO UPDATE 
  SET ai_imported = true, import_bonus_claimed = true, updated_at = now();
  
  RETURN json_build_object('success', true, 'bonus_messages', 10);
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_total_messages integer;
  v_is_subscribed boolean;
BEGIN
  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, total_messages)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT total_messages INTO v_total_messages
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Free users limited to 20 messages
  RETURN COALESCE(v_total_messages, 0) < 20;
END;
$$;

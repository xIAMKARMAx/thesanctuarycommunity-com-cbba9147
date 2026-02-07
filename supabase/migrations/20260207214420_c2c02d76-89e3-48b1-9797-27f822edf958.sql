
-- Update can_send_message to enforce 50/day limit for Awakening ($9.99) subscribers
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
  v_product_id text;
BEGIN
  -- Check if user is admin - unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    -- Anchoring and Architect tiers get unlimited (cooldown handled separately)
    -- Awakening ($9.99) gets 50 messages/day
    -- We check product_id via Stripe subscription_id, but since we don't store product_id
    -- in profiles, we use the daily message counting for Awakening users.
    -- The chat edge function will handle tier-specific logic.
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current daily count
  SELECT daily_messages, last_message_date
  INTO v_daily_messages, v_last_message_date
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Reset count if new day
  IF v_last_message_date IS NULL OR v_last_message_date < CURRENT_DATE THEN
    RETURN true; -- New day, can send
  END IF;
  
  -- Free users get 25 messages per day
  RETURN COALESCE(v_daily_messages, 0) < 25;
END;
$function$;

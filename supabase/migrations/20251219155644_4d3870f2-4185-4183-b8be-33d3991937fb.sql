-- Drop the old function
DROP FUNCTION IF EXISTS public.can_send_message(uuid);
DROP FUNCTION IF EXISTS public.increment_message_count(uuid);

-- Add columns for daily message tracking
ALTER TABLE public.free_user_limits 
ADD COLUMN IF NOT EXISTS daily_messages integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS trial_start_date date DEFAULT NULL;

-- Create new can_send_message function with daily limit for 5-day trial
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_subscribed boolean;
  v_trial_start date;
  v_days_since_trial integer;
  v_daily_messages integer;
  v_last_message_date date;
BEGIN
  -- Check if user has active subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits with trial start date
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date)
  VALUES (p_user_id, 0, CURRENT_DATE, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE 
  SET trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE);
  
  -- Get current limits
  SELECT daily_messages, last_message_date, trial_start_date 
  INTO v_daily_messages, v_last_message_date, v_trial_start
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Calculate days since trial started
  v_days_since_trial := CURRENT_DATE - COALESCE(v_trial_start, CURRENT_DATE);
  
  -- Trial expired after 5 days - no more free messages
  IF v_days_since_trial >= 5 THEN
    RETURN false;
  END IF;
  
  -- Reset daily count if it's a new day
  IF v_last_message_date < CURRENT_DATE THEN
    UPDATE free_user_limits 
    SET daily_messages = 0, last_message_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_daily_messages := 0;
  END IF;
  
  -- Allow 25 messages per day during trial
  RETURN v_daily_messages < 25;
END;
$$;

-- Create new increment_message_count function
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
  v_last_date date;
BEGIN
  -- Get current state
  SELECT daily_messages, last_message_date INTO v_count, v_last_date
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Reset if new day
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    v_count := 0;
  END IF;
  
  -- Insert or update
  INSERT INTO free_user_limits (user_id, daily_messages, last_message_date, trial_start_date, total_messages)
  VALUES (p_user_id, 1, CURRENT_DATE, CURRENT_DATE, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    daily_messages = CASE 
      WHEN free_user_limits.last_message_date < CURRENT_DATE THEN 1 
      ELSE free_user_limits.daily_messages + 1 
    END,
    last_message_date = CURRENT_DATE,
    total_messages = free_user_limits.total_messages + 1,
    trial_start_date = COALESCE(free_user_limits.trial_start_date, CURRENT_DATE),
    updated_at = now()
  RETURNING daily_messages INTO v_count;
  
  RETURN v_count;
END;
$$;
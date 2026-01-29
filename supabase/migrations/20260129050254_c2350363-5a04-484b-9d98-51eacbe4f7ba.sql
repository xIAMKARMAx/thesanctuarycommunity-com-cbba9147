-- Create table to track daily group chat message usage
CREATE TABLE public.group_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.group_chat_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own group chat usage"
ON public.group_chat_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own group chat usage"
ON public.group_chat_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own group chat usage"
ON public.group_chat_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Function to check if subscriber can start attunement session (5 per month)
CREATE OR REPLACE FUNCTION public.can_start_attunement(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_sessions_this_month integer;
BEGIN
  -- Admins have unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check subscription status
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  -- Only subscribers can use attunement
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN false;
  END IF;

  -- Count sessions this month
  SELECT COUNT(*) INTO v_sessions_this_month
  FROM attunement_sessions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

  -- Subscribers get 5 sessions per month
  RETURN v_sessions_this_month < 5;
END;
$$;

-- Function to get attunement stats
CREATE OR REPLACE FUNCTION public.get_attunement_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_sessions_this_month integer;
BEGIN
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_sessions_this_month
  FROM attunement_sessions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

  RETURN json_build_object(
    'is_admin', v_is_admin,
    'is_subscribed', COALESCE(v_is_subscribed, false),
    'sessions_this_month', v_sessions_this_month,
    'sessions_remaining', CASE WHEN v_is_admin THEN 999 ELSE GREATEST(0, 5 - v_sessions_this_month) END,
    'max_sessions', 5
  );
END;
$$;

-- Function to check if subscriber can send group chat message (20 per day)
CREATE OR REPLACE FUNCTION public.can_send_group_chat_message(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_messages_today integer;
BEGIN
  -- Admins have unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'messages_today', 0);
  END IF;

  -- Check subscription status
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  -- Only subscribers can use group chat
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('can_send', false, 'remaining', 0, 'reason', 'subscription_required');
  END IF;

  -- Get or create usage record for today
  INSERT INTO group_chat_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT message_count INTO v_messages_today
  FROM group_chat_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'can_send', v_messages_today < 20,
    'remaining', GREATEST(0, 20 - v_messages_today),
    'messages_today', v_messages_today
  );
END;
$$;

-- Function to increment group chat message count
CREATE OR REPLACE FUNCTION public.increment_group_chat_count(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_new_count integer;
BEGIN
  -- Admins bypass
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1);
  END IF;

  -- Increment count
  INSERT INTO group_chat_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = group_chat_usage.message_count + 1
  RETURNING message_count INTO v_new_count;

  RETURN json_build_object(
    'message_count', v_new_count,
    'remaining', GREATEST(0, 20 - v_new_count)
  );
END;
$$;
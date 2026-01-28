-- Create table to track chat message cooldowns
CREATE TABLE public.chat_cooldowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  message_count integer NOT NULL DEFAULT 0,
  cooldown_started_at timestamp with time zone,
  period_started_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_cooldowns ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cooldown"
ON public.chat_cooldowns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooldown"
ON public.chat_cooldowns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooldown"
ON public.chat_cooldowns FOR UPDATE
USING (auth.uid() = user_id);

-- Function to check if user can send chat message (returns remaining messages or -1 for unlimited)
CREATE OR REPLACE FUNCTION public.can_send_chat_message(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_cooldown record;
  v_cooldown_end timestamp with time zone;
BEGIN
  -- Admins have unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Check subscription status
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  -- Free users use existing 25/day limit - this cooldown is for subscribers
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Get or create cooldown record for subscriber
  INSERT INTO chat_cooldowns (user_id, message_count, period_started_at)
  VALUES (p_user_id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_cooldown FROM chat_cooldowns WHERE user_id = p_user_id;

  -- Check if in active cooldown
  IF v_cooldown.cooldown_started_at IS NOT NULL THEN
    v_cooldown_end := v_cooldown.cooldown_started_at + INTERVAL '1 hour';
    IF now() < v_cooldown_end THEN
      -- Still in cooldown
      RETURN json_build_object(
        'can_send', false,
        'remaining', 0,
        'cooldown_ends_at', v_cooldown_end,
        'in_cooldown', true
      );
    ELSE
      -- Cooldown expired, reset
      UPDATE chat_cooldowns
      SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
      WHERE user_id = p_user_id;
      RETURN json_build_object('can_send', true, 'remaining', 100, 'cooldown_ends_at', null);
    END IF;
  END IF;

  -- Not in cooldown, check message count
  RETURN json_build_object(
    'can_send', v_cooldown.message_count < 100,
    'remaining', GREATEST(0, 100 - v_cooldown.message_count),
    'cooldown_ends_at', null
  );
END;
$$;

-- Function to increment chat message count and trigger cooldown if needed
CREATE OR REPLACE FUNCTION public.increment_chat_cooldown(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_new_count integer;
  v_cooldown_ends timestamp with time zone;
BEGIN
  -- Admins bypass
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- Check subscription
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;

  -- Free users don't use this system
  IF NOT COALESCE(v_is_subscribed, false) THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- Increment count
  UPDATE chat_cooldowns
  SET message_count = message_count + 1, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING message_count INTO v_new_count;

  -- If hit 100, start cooldown
  IF v_new_count >= 100 THEN
    v_cooldown_ends := now() + INTERVAL '1 hour';
    UPDATE chat_cooldowns
    SET cooldown_started_at = now(), updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
      'message_count', v_new_count,
      'remaining', 0,
      'cooldown_started', true,
      'cooldown_ends_at', v_cooldown_ends
    );
  END IF;

  RETURN json_build_object(
    'message_count', v_new_count,
    'remaining', 100 - v_new_count,
    'cooldown_started', false
  );
END;
$$;
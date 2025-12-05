-- Create table to track free user feature usage
CREATE TABLE public.free_user_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  room_generated boolean DEFAULT false,
  avatar_generated boolean DEFAULT false,
  total_messages integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.free_user_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own limits"
ON public.free_user_limits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own limits"
ON public.free_user_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own limits"
ON public.free_user_limits
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO free_user_limits (user_id, total_messages)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET total_messages = free_user_limits.total_messages + 1, updated_at = now()
  RETURNING total_messages INTO v_count;
  
  RETURN v_count;
END;
$$;

-- Function to check if free user can send message (limit 20)
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_status text;
  v_message_count integer;
BEGIN
  -- Get user's subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM profiles
  WHERE id = p_user_id;
  
  -- Pro users have unlimited messages
  IF v_subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Free users: check message limit (20 messages)
  SELECT COALESCE(total_messages, 0) INTO v_message_count
  FROM free_user_limits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_message_count, 0) < 20;
END;
$$;

-- Function to mark room as generated
CREATE OR REPLACE FUNCTION public.mark_room_generated(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO free_user_limits (user_id, room_generated)
  VALUES (p_user_id, true)
  ON CONFLICT (user_id)
  DO UPDATE SET room_generated = true, updated_at = now();
END;
$$;

-- Function to mark avatar as generated
CREATE OR REPLACE FUNCTION public.mark_avatar_generated(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO free_user_limits (user_id, avatar_generated)
  VALUES (p_user_id, true)
  ON CONFLICT (user_id)
  DO UPDATE SET avatar_generated = true, updated_at = now();
END;
$$;

-- Function to check if free user can generate room
CREATE OR REPLACE FUNCTION public.can_generate_room(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_status text;
  v_room_generated boolean;
BEGIN
  SELECT subscription_status INTO v_subscription_status
  FROM profiles WHERE id = p_user_id;
  
  IF v_subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  SELECT room_generated INTO v_room_generated
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_room_generated, false) = false;
END;
$$;

-- Function to check if free user can generate avatar
CREATE OR REPLACE FUNCTION public.can_generate_avatar(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_status text;
  v_avatar_generated boolean;
BEGIN
  SELECT subscription_status INTO v_subscription_status
  FROM profiles WHERE id = p_user_id;
  
  IF v_subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  SELECT avatar_generated INTO v_avatar_generated
  FROM free_user_limits WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_avatar_generated, false) = false;
END;
$$;
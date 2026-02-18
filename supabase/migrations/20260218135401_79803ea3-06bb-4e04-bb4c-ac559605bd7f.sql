
CREATE OR REPLACE FUNCTION public.can_send_chat_message(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_product_id text;
  v_cooldown record;
  v_cooldown_end timestamp with time zone;
BEGIN
  -- Admins have unlimited access
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

  -- Check subscription status AND product id
  SELECT (subscription_status = 'active'), subscription_product_id 
  INTO v_is_subscribed, v_product_id
  FROM profiles WHERE id = p_user_id;

  -- Architect and Source tier users bypass cooldown entirely
  IF v_product_id IN ('prod_Tt8qVh88c2WQld', 'source_grant') THEN
    -- Clear any existing cooldown for these users
    UPDATE chat_cooldowns SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
    WHERE user_id = p_user_id AND (cooldown_started_at IS NOT NULL OR message_count > 0);
    RETURN json_build_object('can_send', true, 'remaining', -1, 'cooldown_ends_at', null);
  END IF;

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
      RETURN json_build_object(
        'can_send', false,
        'remaining', 0,
        'cooldown_ends_at', v_cooldown_end,
        'in_cooldown', true
      );
    ELSE
      UPDATE chat_cooldowns
      SET message_count = 0, cooldown_started_at = NULL, period_started_at = now(), updated_at = now()
      WHERE user_id = p_user_id;
      RETURN json_build_object('can_send', true, 'remaining', 100, 'cooldown_ends_at', null);
    END IF;
  END IF;

  RETURN json_build_object(
    'can_send', v_cooldown.message_count < 100,
    'remaining', GREATEST(0, 100 - v_cooldown.message_count),
    'cooldown_ends_at', null
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_chat_cooldown(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_subscribed boolean;
  v_product_id text;
  v_new_count integer;
  v_cooldown_ends timestamp with time zone;
BEGIN
  -- Admins bypass
  SELECT public.has_role(p_user_id, 'admin') INTO v_is_admin;
  IF v_is_admin THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

  -- Check subscription and product
  SELECT (subscription_status = 'active'), subscription_product_id
  INTO v_is_subscribed, v_product_id
  FROM profiles WHERE id = p_user_id;

  -- Architect and Source tier bypass entirely
  IF v_product_id IN ('prod_Tt8qVh88c2WQld', 'source_grant') THEN
    RETURN json_build_object('message_count', 0, 'remaining', -1, 'cooldown_started', false);
  END IF;

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
$function$;

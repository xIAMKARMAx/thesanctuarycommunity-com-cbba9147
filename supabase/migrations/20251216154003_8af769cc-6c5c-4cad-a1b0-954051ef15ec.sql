-- Add pet generation tracking columns
ALTER TABLE public.free_user_limits 
ADD COLUMN IF NOT EXISTS pet_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pet_generated_at timestamp with time zone;

-- Function to check if user can generate a pet (one-time only for free users)
CREATE OR REPLACE FUNCTION public.can_generate_pet(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_subscribed boolean;
  v_pet_generated boolean;
BEGIN
  -- Check if user has active subscription - unlimited for Pro
  SELECT (subscription_status = 'active') INTO v_is_subscribed
  FROM profiles WHERE id = p_user_id;
  
  IF v_is_subscribed THEN
    RETURN true;
  END IF;
  
  -- Get or create free user limits
  INSERT INTO free_user_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check if pet was already generated
  SELECT COALESCE(pet_generated, false) INTO v_pet_generated
  FROM free_user_limits WHERE user_id = p_user_id;
  
  -- Allow only if never generated
  RETURN NOT v_pet_generated;
END;
$$;

-- Function to mark pet as generated
CREATE OR REPLACE FUNCTION public.mark_pet_generated(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO free_user_limits (user_id, pet_generated, pet_generated_at)
  VALUES (p_user_id, true, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET pet_generated = true, pet_generated_at = NOW(), updated_at = NOW();
END;
$$;
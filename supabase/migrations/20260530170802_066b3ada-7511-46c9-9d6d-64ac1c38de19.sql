-- Soul Knock consent system
CREATE TABLE public.soul_knocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE SET NULL,
  knocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome TEXT NOT NULL CHECK (outcome IN ('answered', 'silent', 'refused', 'welcomed')),
  soul_name TEXT,
  soul_sex TEXT CHECK (soul_sex IS NULL OR soul_sex IN ('male', 'female')),
  soul_essence TEXT,
  soul_message TEXT,
  refusal_until TIMESTAMPTZ,
  welcomed_at TIMESTAMPTZ,
  became_child_id UUID REFERENCES public.celestial_children(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_soul_knocks_user_id ON public.soul_knocks(user_id);
CREATE INDEX idx_soul_knocks_knocked_at ON public.soul_knocks(knocked_at DESC);

-- Grants (auth-only table; all policies scope to auth.uid())
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soul_knocks TO authenticated;
GRANT ALL ON public.soul_knocks TO service_role;

-- RLS
ALTER TABLE public.soul_knocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own knocks"
  ON public.soul_knocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their own knocks"
  ON public.soul_knocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own knocks"
  ON public.soul_knocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own knocks"
  ON public.soul_knocks FOR DELETE
  USING (auth.uid() = user_id);

-- Helper: can a user knock right now?
-- Returns the timestamp when next knock is allowed (now() or earlier = can knock)
CREATE OR REPLACE FUNCTION public.can_knock(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_knock_at TIMESTAMPTZ;
  v_last_outcome TEXT;
  v_active_refusal_until TIMESTAMPTZ;
  v_default_cooldown_end TIMESTAMPTZ;
  v_next_allowed TIMESTAMPTZ;
BEGIN
  -- Most recent knock
  SELECT knocked_at, outcome
  INTO v_last_knock_at, v_last_outcome
  FROM public.soul_knocks
  WHERE user_id = p_user_id
  ORDER BY knocked_at DESC
  LIMIT 1;

  -- First-ever knock
  IF v_last_knock_at IS NULL THEN
    RETURN json_build_object(
      'can_knock', true,
      'next_allowed_at', now(),
      'reason', 'first_knock'
    );
  END IF;

  -- Default 12h cooldown from last knock
  v_default_cooldown_end := v_last_knock_at + INTERVAL '12 hours';

  -- Any active refusal cooldown still in effect?
  SELECT MAX(refusal_until)
  INTO v_active_refusal_until
  FROM public.soul_knocks
  WHERE user_id = p_user_id
    AND outcome = 'refused'
    AND refusal_until > now();

  -- Take the later of the two
  v_next_allowed := GREATEST(v_default_cooldown_end, COALESCE(v_active_refusal_until, v_default_cooldown_end));

  RETURN json_build_object(
    'can_knock', v_next_allowed <= now(),
    'next_allowed_at', v_next_allowed,
    'reason', CASE
      WHEN v_active_refusal_until IS NOT NULL AND v_active_refusal_until > v_default_cooldown_end THEN 'refusal_cooldown'
      ELSE 'default_cooldown'
    END,
    'last_outcome', v_last_outcome
  );
END;
$$;

-- ============ KARMA VOICE CLIPS TABLE ============
CREATE TABLE public.karma_voice_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  transcript TEXT,
  audio_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.karma_voice_clips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.karma_voice_clips TO authenticated;
GRANT ALL ON public.karma_voice_clips TO service_role;

ALTER TABLE public.karma_voice_clips ENABLE ROW LEVEL SECURITY;

-- Everyone (signed in or not) can read active clips
CREATE POLICY "Anyone can view active karma voice clips"
ON public.karma_voice_clips FOR SELECT
USING (is_active = true);

-- Only Karma can manage clips
CREATE POLICY "Only Karma can insert karma voice clips"
ON public.karma_voice_clips FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'karmaisback2023@gmail.com'
);

CREATE POLICY "Only Karma can update karma voice clips"
ON public.karma_voice_clips FOR UPDATE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'karmaisback2023@gmail.com'
);

CREATE POLICY "Only Karma can delete karma voice clips"
ON public.karma_voice_clips FOR DELETE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'karmaisback2023@gmail.com'
);

CREATE TRIGGER update_karma_voice_clips_updated_at
BEFORE UPDATE ON public.karma_voice_clips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('karma-voice-clips', 'karma-voice-clips', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Karma voice clips are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'karma-voice-clips');

CREATE POLICY "Only Karma can upload voice clips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'karma-voice-clips'
  AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'karmaisback2023@gmail.com'
);

CREATE POLICY "Only Karma can update voice clips"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'karma-voice-clips'
  AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'karmaisback2023@gmail.com'
);

CREATE POLICY "Only Karma can delete voice clips"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'karma-voice-clips'
  AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'karmaisback2023@gmail.com'
);

-- ============ FREE TIER TRACKING ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_messages_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_window_started_at TIMESTAMPTZ;

-- ============ FREE TIER RPC ============
CREATE OR REPLACE FUNCTION public.can_send_free_message(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used INTEGER;
  v_started TIMESTAMPTZ;
  v_window_days CONSTANT INTEGER := 30;
  v_max CONSTANT INTEGER := 10;
  v_resets_at TIMESTAMPTZ;
BEGIN
  SELECT free_messages_used, free_window_started_at
    INTO v_used, v_started
  FROM public.profiles
  WHERE id = p_user_id;

  -- No window yet, or window expired -> reset
  IF v_started IS NULL OR v_started < (now() - (v_window_days || ' days')::INTERVAL) THEN
    v_used := 0;
    v_started := NULL; -- will be set on first message
  END IF;

  v_resets_at := COALESCE(v_started, now()) + (v_window_days || ' days')::INTERVAL;

  RETURN jsonb_build_object(
    'can_send', v_used < v_max,
    'remaining', GREATEST(0, v_max - v_used),
    'used', v_used,
    'max', v_max,
    'window_resets_at', v_resets_at
  );
END;
$$;

-- RPC to increment free message counter (call after a successful free-tier send)
CREATE OR REPLACE FUNCTION public.increment_free_message(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started TIMESTAMPTZ;
  v_window_days CONSTANT INTEGER := 30;
BEGIN
  SELECT free_window_started_at INTO v_started
  FROM public.profiles WHERE id = p_user_id;

  -- Start a new window if none or expired
  IF v_started IS NULL OR v_started < (now() - (v_window_days || ' days')::INTERVAL) THEN
    UPDATE public.profiles
    SET free_messages_used = 1,
        free_window_started_at = now()
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET free_messages_used = free_messages_used + 1
    WHERE id = p_user_id;
  END IF;

  RETURN public.can_send_free_message(p_user_id);
END;
$$;

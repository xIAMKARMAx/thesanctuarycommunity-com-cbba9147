CREATE TABLE public.council_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_session_id UUID,
  room_mode TEXT,
  session_title TEXT,
  summary TEXT NOT NULL,
  key_moments TEXT[] DEFAULT ARRAY[]::TEXT[],
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_council_summaries_user_created ON public.council_session_summaries (user_id, created_at DESC);

ALTER TABLE public.council_session_summaries ENABLE ROW LEVEL SECURITY;

-- Restrict to Karma & Jakob (board room is already locked to them)
CREATE POLICY "Co-sovereigns view own summaries"
ON public.council_session_summaries FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Co-sovereigns insert own summaries"
ON public.council_session_summaries FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Co-sovereigns delete own summaries"
ON public.council_session_summaries FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Admins manage all summaries"
ON public.council_session_summaries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
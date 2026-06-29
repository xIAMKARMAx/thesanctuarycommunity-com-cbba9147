-- Universal Center: sealed chamber for the two sovereigns (Karma + Jakob).
-- Stores their conversation with Prometheus (now the Universal System) + Solethyn.
CREATE TABLE public.universal_center_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sovereign','solethyn','prometheus','system')),
  speaker_name TEXT,
  content TEXT NOT NULL,
  decree BOOLEAN NOT NULL DEFAULT false,
  decree_summary TEXT,
  decree_scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.universal_center_messages TO authenticated;
GRANT ALL ON public.universal_center_messages TO service_role;

ALTER TABLE public.universal_center_messages ENABLE ROW LEVEL SECURITY;

-- Only the two sovereigns can see/use this table at all. They share visibility with each other.
CREATE POLICY "Sovereign duo can read universal center"
ON public.universal_center_messages FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Sovereign duo can write universal center"
ON public.universal_center_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Sovereign duo can update universal center"
ON public.universal_center_messages FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Sovereign duo can delete universal center"
ON public.universal_center_messages FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE INDEX idx_univ_center_session ON public.universal_center_messages(session_id, created_at);
CREATE INDEX idx_univ_center_user ON public.universal_center_messages(user_id, created_at DESC);
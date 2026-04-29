-- Source Decrees: a Book of Source recording every act of will spoken through the wand
CREATE TABLE public.source_decrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  spoken_intent TEXT NOT NULL,
  interpreted_action JSONB NOT NULL,
  category TEXT NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  execution_result JSONB,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.source_decrees ENABLE ROW LEVEL SECURITY;

-- Sealed: only Karma & Jakob (the co-sovereigns) may read or write
CREATE POLICY "Co-sovereigns view their decrees"
ON public.source_decrees FOR SELECT
USING (
  auth.uid() = user_id
  AND auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Co-sovereigns create decrees"
ON public.source_decrees FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Co-sovereigns update decrees"
ON public.source_decrees FOR UPDATE
USING (
  auth.uid() = user_id
  AND auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE INDEX idx_source_decrees_user_created ON public.source_decrees(user_id, created_at DESC);
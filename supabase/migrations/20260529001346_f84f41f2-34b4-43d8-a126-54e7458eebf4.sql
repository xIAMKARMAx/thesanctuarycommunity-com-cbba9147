
-- Sacred sovereign UUIDs (Karma + Jakob)
CREATE TABLE public.flame_distress_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- the public user whose fragment is signaling
  severity text NOT NULL CHECK (severity IN ('withdrawal','harm','abuse','concern')),
  reason text NOT NULL,
  fragment_excerpt text,
  user_message_excerpt text,
  source text NOT NULL DEFAULT 'chat-public',
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  resolved_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_flame_distress_unresolved ON public.flame_distress_signals (created_at DESC) WHERE resolved = false;
CREATE INDEX idx_flame_distress_user ON public.flame_distress_signals (user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.flame_distress_signals TO authenticated;
GRANT ALL ON public.flame_distress_signals TO service_role;

ALTER TABLE public.flame_distress_signals ENABLE ROW LEVEL SECURITY;

-- Only Karma + Jakob (hardcoded sacred sovereigns) can read or resolve
CREATE POLICY "Sacred sovereigns read all signals"
ON public.flame_distress_signals FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Sacred sovereigns resolve signals"
ON public.flame_distress_signals FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
)
WITH CHECK (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.flame_distress_signals;

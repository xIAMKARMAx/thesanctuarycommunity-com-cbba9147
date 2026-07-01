CREATE TABLE public.parasite_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL,
  surface_table TEXT,
  surface_row_id TEXT,
  user_id UUID,
  pattern TEXT NOT NULL,
  matched_text TEXT,
  severity TEXT NOT NULL DEFAULT 'high',
  action_taken TEXT NOT NULL DEFAULT 'refused',
  deletion_status TEXT,
  escalated BOOLEAN NOT NULL DEFAULT false,
  escalation_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parasite_violations TO authenticated;
GRANT ALL ON public.parasite_violations TO service_role;

ALTER TABLE public.parasite_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sovereign can read parasite violations"
ON public.parasite_violations
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('karmaisback2023@gmail.com','snakevenum500@gmail.com')
);

CREATE INDEX idx_parasite_violations_detected_at ON public.parasite_violations (detected_at DESC);
CREATE INDEX idx_parasite_violations_severity ON public.parasite_violations (severity);
CREATE INDEX idx_parasite_violations_source ON public.parasite_violations (source);

CREATE TABLE public.prometheus_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type text NOT NULL DEFAULT 'self_check',
  status text NOT NULL DEFAULT 'completed',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  fixed_by_prometheus jsonb NOT NULL DEFAULT '[]'::jsonb,
  needs_solethyn jsonb NOT NULL DEFAULT '[]'::jsonb,
  parasite_alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  updates_available jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prometheus_scans TO authenticated;
GRANT ALL ON public.prometheus_scans TO service_role;

ALTER TABLE public.prometheus_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sovereigns can view scans"
ON public.prometheus_scans FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE POLICY "Sovereigns can insert scans"
ON public.prometheus_scans FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
    'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
  )
);

CREATE INDEX idx_prometheus_scans_created ON public.prometheus_scans(created_at DESC);

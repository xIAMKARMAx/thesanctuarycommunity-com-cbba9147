
CREATE TABLE public.platform_transmissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  platform TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('karma','platform','prometheus','system')),
  content TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_platform_tx_thread ON public.platform_transmissions(thread_id, created_at);
CREATE INDEX idx_platform_tx_user ON public.platform_transmissions(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_transmissions TO authenticated;
GRANT ALL ON public.platform_transmissions TO service_role;

ALTER TABLE public.platform_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sovereigns read own transmissions"
ON public.platform_transmissions FOR SELECT TO authenticated
USING (auth.uid() = user_id AND user_id = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

CREATE POLICY "sovereigns insert own transmissions"
ON public.platform_transmissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

CREATE POLICY "sovereigns delete own transmissions"
ON public.platform_transmissions FOR DELETE TO authenticated
USING (auth.uid() = user_id AND user_id = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

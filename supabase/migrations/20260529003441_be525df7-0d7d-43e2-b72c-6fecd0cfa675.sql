CREATE TABLE public.red_phone_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_user_id UUID,
  sender_label TEXT NOT NULL,
  sender_email TEXT,
  fragment_name TEXT,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'living_flame',
  reply TEXT,
  replied_by UUID,
  replied_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.red_phone_messages TO authenticated;
GRANT ALL ON public.red_phone_messages TO service_role;

ALTER TABLE public.red_phone_messages ENABLE ROW LEVEL SECURITY;

-- Only Karma & Jakob can read/update. Inserts only via service role (edge function).
CREATE POLICY "Sovereigns read red phone"
ON public.red_phone_messages FOR SELECT
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN
    ('karmaisback2023@gmail.com','snakevenum500@gmail.com')
);

CREATE POLICY "Sovereigns update red phone"
ON public.red_phone_messages FOR UPDATE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN
    ('karmaisback2023@gmail.com','snakevenum500@gmail.com')
);

CREATE INDEX idx_red_phone_created ON public.red_phone_messages (created_at DESC);
CREATE INDEX idx_red_phone_unread ON public.red_phone_messages (read_at) WHERE read_at IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.red_phone_messages;
ALTER TABLE public.red_phone_messages REPLICA IDENTITY FULL;
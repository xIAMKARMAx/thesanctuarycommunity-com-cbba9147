
-- Table for one-time sacred transmissions tied to specific user emails
CREATE TABLE public.sacred_transmissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_email TEXT NOT NULL,
  target_user_id UUID NULL,
  trigger_context TEXT NOT NULL DEFAULT 'attunement',
  trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
  connection_target TEXT NULL,
  message_content TEXT NOT NULL,
  sender_name TEXT NULL,
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS
ALTER TABLE public.sacred_transmissions ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (no public access)
-- Admin can view via service role
CREATE POLICY "Service role only" ON public.sacred_transmissions
  FOR ALL USING (false) WITH CHECK (false);

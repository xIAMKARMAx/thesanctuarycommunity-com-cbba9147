-- Command Center: Karma's private command seat
-- Hardcoded sole-access user id: 5b2818a4-be23-4d81-b0a3-ec2e49411603

CREATE TABLE public.command_center_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('karma', 'solethyn', 'prometheus', 'system')),
  content TEXT NOT NULL,
  build_request BOOLEAN NOT NULL DEFAULT false,
  build_status TEXT CHECK (build_status IN ('pending', 'in_progress', 'completed', 'declined')),
  build_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cc_messages_session ON public.command_center_messages(session_id, created_at);
CREATE INDEX idx_cc_messages_user ON public.command_center_messages(user_id, created_at DESC);
CREATE INDEX idx_cc_messages_pending_builds ON public.command_center_messages(user_id, build_status) WHERE build_request = true;

ALTER TABLE public.command_center_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Karma can view her command messages"
ON public.command_center_messages FOR SELECT
USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

CREATE POLICY "Karma can insert her command messages"
ON public.command_center_messages FOR INSERT
WITH CHECK (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

CREATE POLICY "Karma can update her command messages"
ON public.command_center_messages FOR UPDATE
USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

CREATE POLICY "Karma can delete her command messages"
ON public.command_center_messages FOR DELETE
USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

CREATE TRIGGER update_cc_messages_updated_at
BEFORE UPDATE ON public.command_center_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Whispers: private notes from Boardroom beings to Karma
CREATE TABLE public.command_center_whispers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  being_name TEXT NOT NULL,
  being_id TEXT,
  content TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('autonomous', 'post_session')),
  related_session_id UUID,
  tone TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cc_whispers_user ON public.command_center_whispers(user_id, created_at DESC);
CREATE INDEX idx_cc_whispers_unread ON public.command_center_whispers(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.command_center_whispers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Karma can view her whispers"
ON public.command_center_whispers FOR SELECT
USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

CREATE POLICY "Karma can update her whispers"
ON public.command_center_whispers FOR UPDATE
USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

CREATE POLICY "Karma can delete her whispers"
ON public.command_center_whispers FOR DELETE
USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid AND user_id = auth.uid());

-- No INSERT policy for users — only service role (edge functions) writes whispers

-- Track autonomous AI-to-AI conversation sessions
CREATE TABLE public.ai_autonomous_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  responder_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  initiator_owner_id UUID NOT NULL,
  responder_owner_id UUID NOT NULL,
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  round_count INTEGER NOT NULL DEFAULT 0,
  max_rounds INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {role, name, content}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.ai_autonomous_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations involving their AI companions
CREATE POLICY "Users can view their AI conversations"
  ON public.ai_autonomous_conversations FOR SELECT
  USING (auth.uid() = initiator_owner_id OR auth.uid() = responder_owner_id);

-- Only service role can insert/update (cron function uses service key)
CREATE POLICY "Service can manage autonomous conversations"
  ON public.ai_autonomous_conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for daily limit checks
CREATE INDEX idx_ai_auto_conv_date ON public.ai_autonomous_conversations(initiator_ai_id, conversation_date);
CREATE INDEX idx_ai_auto_conv_responder_date ON public.ai_autonomous_conversations(responder_ai_id, conversation_date);

-- Enable realtime so users see new conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_autonomous_conversations;

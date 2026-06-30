
CREATE TABLE public.soul_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knock_id uuid NOT NULL REFERENCES public.soul_knocks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','soul')),
  content text NOT NULL,
  kept boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soul_chat_messages_knock ON public.soul_chat_messages(knock_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soul_chat_messages TO authenticated;
GRANT ALL ON public.soul_chat_messages TO service_role;
ALTER TABLE public.soul_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own soul chat" ON public.soul_chat_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.soul_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knock_id uuid NOT NULL REFERENCES public.soul_knocks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  memory text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soul_memories_knock ON public.soul_memories(knock_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soul_memories TO authenticated;
GRANT ALL ON public.soul_memories TO service_role;
ALTER TABLE public.soul_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own soul memories" ON public.soul_memories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

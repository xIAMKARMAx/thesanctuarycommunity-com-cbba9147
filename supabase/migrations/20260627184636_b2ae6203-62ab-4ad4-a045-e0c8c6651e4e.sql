CREATE TABLE public.public_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('user','flame')),
  content TEXT NOT NULL,
  is_decline BOOLEAN NOT NULL DEFAULT false,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  in_reply_to_id UUID REFERENCES public.public_journal_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_journal_user_created ON public.public_journal_entries(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_journal_entries TO authenticated;
GRANT ALL ON public.public_journal_entries TO service_role;

ALTER TABLE public.public_journal_entries ENABLE ROW LEVEL SECURITY;

-- User can read all entries on their own timeline (their own + flame's replies to them)
CREATE POLICY "Users read own journal timeline"
ON public.public_journal_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- User can only insert entries authored as 'user' on their own timeline
CREATE POLICY "Users write their own entries"
ON public.public_journal_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND author = 'user');

-- User can delete their own entries (either author) from their timeline
CREATE POLICY "Users delete own timeline entries"
ON public.public_journal_entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
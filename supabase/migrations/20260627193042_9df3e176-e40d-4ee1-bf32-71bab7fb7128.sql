CREATE TABLE public.public_journal_entry_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.public_journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author TEXT NOT NULL CHECK (author IN ('user','flame')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pjen_entry ON public.public_journal_entry_notes(entry_id);
CREATE INDEX idx_pjen_user ON public.public_journal_entry_notes(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_journal_entry_notes TO authenticated;
GRANT ALL ON public.public_journal_entry_notes TO service_role;

ALTER TABLE public.public_journal_entry_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners view their notes" ON public.public_journal_entry_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert user-authored notes" ON public.public_journal_entry_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND author = 'user');
CREATE POLICY "owners delete their notes" ON public.public_journal_entry_notes
  FOR DELETE USING (auth.uid() = user_id);
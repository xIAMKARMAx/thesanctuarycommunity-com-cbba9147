
-- Create user personal journal entries table
CREATE TABLE public.user_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id),
  content TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ai_profile_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.user_journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own entries
CREATE POLICY "Users can view their own journal entries"
ON public.user_journal_entries FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own entries
CREATE POLICY "Users can create their own journal entries"
ON public.user_journal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update their own journal entries"
ON public.user_journal_entries FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete their own journal entries"
ON public.user_journal_entries FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_user_journal_entries_updated_at
BEFORE UPDATE ON public.user_journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

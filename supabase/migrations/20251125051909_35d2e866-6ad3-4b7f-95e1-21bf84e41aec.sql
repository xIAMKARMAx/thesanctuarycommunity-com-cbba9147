-- Add additional profile fields for user information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create journal_entries table for AI reflections
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  key_moments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for journal_entries
CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
ON public.journal_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updating journal_entries updated_at
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date 
ON public.journal_entries(user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_conversation 
ON public.journal_entries(conversation_id);
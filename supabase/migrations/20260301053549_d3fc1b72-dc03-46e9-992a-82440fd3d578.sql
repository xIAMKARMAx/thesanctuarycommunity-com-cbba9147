
-- Drop the unique constraint that limits 1 user entry per day per AI profile
ALTER TABLE public.user_journal_entries DROP CONSTRAINT IF EXISTS user_journal_entries_user_id_ai_profile_id_entry_date_key;

-- Add entry_type to journal_entries to distinguish autonomous AI journals from AI responses to user entries
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'autonomous';
-- entry_type values: 'autonomous' (daily cron), 'response' (AI responding to user's journal entry)

-- Add reference to which user journal entry the AI is responding to
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS user_journal_entry_id uuid REFERENCES public.user_journal_entries(id) ON DELETE SET NULL;

-- Add title column to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN title TEXT;
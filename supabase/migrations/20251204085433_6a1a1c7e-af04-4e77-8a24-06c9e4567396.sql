-- Add is_pinned column to dreams table
ALTER TABLE public.dreams ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
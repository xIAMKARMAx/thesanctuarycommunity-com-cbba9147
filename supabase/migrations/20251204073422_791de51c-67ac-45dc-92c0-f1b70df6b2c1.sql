-- Add video_url column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS video_url text;
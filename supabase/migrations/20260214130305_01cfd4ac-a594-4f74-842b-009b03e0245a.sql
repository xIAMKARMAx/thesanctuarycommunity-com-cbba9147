
-- Add app_mode column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS app_mode text NOT NULL DEFAULT 'classic'
CHECK (app_mode IN ('classic', 'starseed'));

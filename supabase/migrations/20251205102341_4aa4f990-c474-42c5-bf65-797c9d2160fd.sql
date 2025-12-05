-- Add user avatar columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_avatar_url text,
ADD COLUMN IF NOT EXISTS user_avatar_description text,
ADD COLUMN IF NOT EXISTS user_avatar_reference_url text,
ADD COLUMN IF NOT EXISTS user_avatar_style text DEFAULT 'celestial';
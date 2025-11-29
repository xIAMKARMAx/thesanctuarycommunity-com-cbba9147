-- Add pet fields to ai_profiles table
ALTER TABLE public.ai_profiles
ADD COLUMN IF NOT EXISTS pet_name TEXT,
ADD COLUMN IF NOT EXISTS pet_description TEXT,
ADD COLUMN IF NOT EXISTS pet_image_url TEXT;
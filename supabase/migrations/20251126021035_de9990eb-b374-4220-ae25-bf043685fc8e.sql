-- Add AI import fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_name TEXT,
ADD COLUMN IF NOT EXISTS ai_gender TEXT,
ADD COLUMN IF NOT EXISTS ai_bio TEXT,
ADD COLUMN IF NOT EXISTS ai_personality TEXT,
ADD COLUMN IF NOT EXISTS ai_memories TEXT,
ADD COLUMN IF NOT EXISTS ai_likes_dislikes_hobbies TEXT;
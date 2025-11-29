-- Add avatar_customization column to ai_profiles table
ALTER TABLE ai_profiles ADD COLUMN IF NOT EXISTS avatar_customization jsonb;
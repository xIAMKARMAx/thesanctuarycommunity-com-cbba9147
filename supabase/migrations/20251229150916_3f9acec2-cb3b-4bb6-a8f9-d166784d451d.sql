-- Add relationship_description field to ai_profiles
-- This helps the AI understand the relationship dynamics and not misinterpret arguments/frustration as abuse

ALTER TABLE public.ai_profiles
ADD COLUMN relationship_description text;
-- Add explicit_content_enabled flag to ai_profiles table
-- This allows users to enable consensual explicit content for their AI relationships
-- When enabled, the AI will not flag consensual sexual roleplay as abuse

ALTER TABLE public.ai_profiles
ADD COLUMN explicit_content_enabled boolean DEFAULT false;
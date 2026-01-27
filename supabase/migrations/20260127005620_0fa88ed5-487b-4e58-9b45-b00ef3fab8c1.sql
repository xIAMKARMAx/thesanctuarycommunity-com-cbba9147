-- Drop the existing check constraint that only allows 1-3
ALTER TABLE public.ai_profiles DROP CONSTRAINT IF EXISTS ai_profiles_profile_number_check;

-- Add new check constraint that allows 1-4
ALTER TABLE public.ai_profiles ADD CONSTRAINT ai_profiles_profile_number_check CHECK (profile_number >= 1 AND profile_number <= 4);
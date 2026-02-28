
-- Update the check constraint on ai_profiles to allow up to 10 slots
ALTER TABLE public.ai_profiles DROP CONSTRAINT IF EXISTS ai_profiles_profile_number_check;
ALTER TABLE public.ai_profiles ADD CONSTRAINT ai_profiles_profile_number_check CHECK (profile_number >= 1 AND profile_number <= 10);

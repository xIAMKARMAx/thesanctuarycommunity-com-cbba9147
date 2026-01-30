-- Update the check constraint to allow profile_number 1-5 for VIP users
ALTER TABLE public.ai_profiles DROP CONSTRAINT ai_profiles_profile_number_check;

ALTER TABLE public.ai_profiles ADD CONSTRAINT ai_profiles_profile_number_check 
CHECK (profile_number >= 1 AND profile_number <= 5);

-- Revert global constraint back to 8
ALTER TABLE public.ai_profiles DROP CONSTRAINT IF EXISTS ai_profiles_profile_number_check;
ALTER TABLE public.ai_profiles ADD CONSTRAINT ai_profiles_profile_number_check CHECK (profile_number >= 1 AND profile_number <= 10);

-- Add custom_being_limit column to profiles if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'custom_being_limit') THEN
    ALTER TABLE public.profiles ADD COLUMN custom_being_limit integer DEFAULT NULL;
  END IF;
END $$;

-- Set your account to 10 slots
UPDATE public.profiles SET custom_being_limit = 10 WHERE id = '5b2818a4-be23-4d81-b0a3-ec2e49411603';

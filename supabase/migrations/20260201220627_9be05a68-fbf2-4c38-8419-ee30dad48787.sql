-- Add legal consent tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tos_version text DEFAULT NULL;

-- Create index for efficient querying of users who need consent
CREATE INDEX IF NOT EXISTS idx_profiles_tos_accepted ON public.profiles(tos_accepted_at) WHERE tos_accepted_at IS NULL;
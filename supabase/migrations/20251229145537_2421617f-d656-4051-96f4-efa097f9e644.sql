-- Add data training opt-out column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_training_opt_out boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.data_training_opt_out IS 'If true, user has opted out of having their chats/interactions used for model improvement';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'standard';

COMMENT ON COLUMN public.profiles.account_type IS 'standard = normal user (seeker/subscriber), social_only = free social tier with no AI access';
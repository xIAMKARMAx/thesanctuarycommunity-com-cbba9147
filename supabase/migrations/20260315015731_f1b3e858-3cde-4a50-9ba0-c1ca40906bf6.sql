ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS usage_limit_notice_accepted_at TIMESTAMPTZ DEFAULT NULL;
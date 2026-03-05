ALTER TABLE public.realm_sessions 
ADD COLUMN IF NOT EXISTS being_states jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_visited_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS realm_day_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS environment_state jsonb DEFAULT '{}'::jsonb;
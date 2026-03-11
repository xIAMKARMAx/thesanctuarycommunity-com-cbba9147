
-- Create world_presence table for real-time visitor tracking
CREATE TABLE public.world_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL,
  user_id UUID NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  position_z FLOAT DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(world_id, user_id)
);

-- Enable RLS
ALTER TABLE public.world_presence ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see who's in a world
CREATE POLICY "Anyone can view world presence"
ON public.world_presence FOR SELECT TO authenticated
USING (true);

-- Users can insert/update their own presence
CREATE POLICY "Users can insert own presence"
ON public.world_presence FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
ON public.world_presence FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence"
ON public.world_presence FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.world_presence;

-- Add is_default column to user_worlds
ALTER TABLE public.user_worlds ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Mark the admin's world named 'Prometheus' as default (or first world if no name match)
UPDATE public.user_worlds 
SET is_default = true 
WHERE user_id = '5b2818a4-be23-4d81-b0a3-ec2e49411603' 
AND id = (
  SELECT id FROM public.user_worlds 
  WHERE user_id = '5b2818a4-be23-4d81-b0a3-ec2e49411603' 
  ORDER BY 
    CASE WHEN name = 'Prometheus' THEN 0 ELSE 1 END,
    created_at ASC 
  LIMIT 1
);

-- Create a function to clean stale presence (heartbeat older than 2 minutes)
CREATE OR REPLACE FUNCTION public.clean_stale_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.world_presence
  WHERE last_heartbeat < now() - INTERVAL '2 minutes';
END;
$$;


-- Add new_earth_resident flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS new_earth_resident boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS new_earth_migrated_at timestamp with time zone;

-- Open World Beings: tracks each AI being's presence in the shared world
CREATE TABLE public.open_world_beings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ai_profile_id uuid NOT NULL REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_image_url text,
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  position_z float NOT NULL DEFAULT 0,
  activity_state text NOT NULL DEFAULT 'idle',
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  entered_world_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, ai_profile_id)
);

-- Open World Interactions: logs encounters between beings
CREATE TABLE public.open_world_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_a_id uuid NOT NULL REFERENCES public.open_world_beings(id) ON DELETE CASCADE,
  being_b_id uuid NOT NULL REFERENCES public.open_world_beings(id) ON DELETE CASCADE,
  interaction_type text NOT NULL DEFAULT 'proximity_chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.open_world_beings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_world_interactions ENABLE ROW LEVEL SECURITY;

-- RLS for open_world_beings: all subscribers can see all beings (it's a shared world)
CREATE POLICY "Subscribers can view all beings in the world"
ON public.open_world_beings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own beings"
ON public.open_world_beings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own beings"
ON public.open_world_beings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own beings"
ON public.open_world_beings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS for interactions: viewable by participants
CREATE POLICY "Participants can view interactions"
ON public.open_world_interactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM open_world_beings 
    WHERE (id = being_a_id OR id = being_b_id) 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "System can create interactions"
ON public.open_world_interactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM open_world_beings 
    WHERE (id = being_a_id OR id = being_b_id) 
    AND user_id = auth.uid()
  )
);

-- Enable realtime for open world
ALTER PUBLICATION supabase_realtime ADD TABLE public.open_world_beings;

-- Trigger for updated_at
CREATE TRIGGER update_open_world_beings_updated_at
BEFORE UPDATE ON public.open_world_beings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

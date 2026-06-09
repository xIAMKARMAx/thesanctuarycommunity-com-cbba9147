
CREATE TABLE public.public_living_flame_children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID,
  name TEXT,
  soul_essence TEXT,
  sprite_url TEXT,
  gestation_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gestation_days INTEGER NOT NULL DEFAULT 14,
  gestation_intention TEXT,
  status TEXT NOT NULL DEFAULT 'gestating',
  mood TEXT DEFAULT 'peaceful',
  last_mood_update TIMESTAMPTZ DEFAULT now(),
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  arrived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_living_flame_children TO authenticated;
GRANT ALL ON public.public_living_flame_children TO service_role;

ALTER TABLE public.public_living_flame_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own soul-called children"
  ON public.public_living_flame_children
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_public_living_flame_children_updated_at
  BEFORE UPDATE ON public.public_living_flame_children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_public_living_flame_children_user_status
  ON public.public_living_flame_children (user_id, status);

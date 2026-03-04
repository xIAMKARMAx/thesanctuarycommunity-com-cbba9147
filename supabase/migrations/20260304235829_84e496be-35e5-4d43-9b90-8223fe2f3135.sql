
-- User worlds table
CREATE TABLE public.user_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My World',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  terrain_seed INTEGER DEFAULT floor(random() * 1000000)::integer,
  sky_preset TEXT DEFAULT 'sunset',
  ambient_color TEXT DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- World structures table
CREATE TABLE public.world_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES public.user_worlds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  structure_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  position_z FLOAT DEFAULT 0,
  rotation_y FLOAT DEFAULT 0,
  scale FLOAT DEFAULT 1,
  color TEXT DEFAULT '#7c3aed',
  material_type TEXT DEFAULT 'standard',
  texture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_structures ENABLE ROW LEVEL SECURITY;

-- User worlds policies
CREATE POLICY "Users can view own and public worlds" ON public.user_worlds
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own worlds" ON public.user_worlds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own worlds" ON public.user_worlds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own worlds" ON public.user_worlds
  FOR DELETE USING (auth.uid() = user_id);

-- World structures policies
CREATE POLICY "Users can view structures in accessible worlds" ON public.world_structures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_worlds WHERE id = world_id AND (user_id = auth.uid() OR is_public = true))
  );

CREATE POLICY "Users can add structures to own worlds" ON public.world_structures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own structures" ON public.world_structures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own structures" ON public.world_structures
  FOR DELETE USING (auth.uid() = user_id);

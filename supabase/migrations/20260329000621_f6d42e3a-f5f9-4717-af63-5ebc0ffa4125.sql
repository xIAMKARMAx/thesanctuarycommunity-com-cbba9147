
-- Create soul_lineages table
CREATE TABLE public.soul_lineages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lineage_type TEXT NOT NULL,
  lineage_name TEXT NOT NULL,
  lineage_description TEXT,
  origin_realm TEXT,
  traits TEXT[] DEFAULT '{}',
  strengths TEXT,
  soul_mission TEXT,
  past_life_connections TEXT,
  reading_response JSONB,
  is_source BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.soul_lineages ENABLE ROW LEVEL SECURITY;

-- Anyone can view lineages (public profiles)
CREATE POLICY "Anyone can view lineages" ON public.soul_lineages
  FOR SELECT USING (true);

-- Users can insert their own lineage
CREATE POLICY "Users can insert own lineage" ON public.soul_lineages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own lineage
CREATE POLICY "Users can update own lineage" ON public.soul_lineages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add lineage_type column to soul_profiles for quick access
ALTER TABLE public.soul_profiles ADD COLUMN IF NOT EXISTS lineage_type TEXT;
ALTER TABLE public.soul_profiles ADD COLUMN IF NOT EXISTS lineage_name TEXT;

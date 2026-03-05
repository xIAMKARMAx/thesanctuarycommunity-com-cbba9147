
-- Add public world gallery support
-- Add visitor tracking and world discovery columns
ALTER TABLE public.user_worlds ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.user_worlds ADD COLUMN IF NOT EXISTS visitor_count integer DEFAULT 0;
ALTER TABLE public.user_worlds ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- World visits table for tracking who visited which world
CREATE TABLE IF NOT EXISTS public.world_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid REFERENCES public.user_worlds(id) ON DELETE CASCADE NOT NULL,
  visitor_id uuid NOT NULL,
  visited_at timestamptz DEFAULT now(),
  UNIQUE(world_id, visitor_id)
);

ALTER TABLE public.world_visits ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see visits
CREATE POLICY "Users can see world visits" ON public.world_visits
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own visits
CREATE POLICY "Users can record visits" ON public.world_visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = visitor_id);

-- Update user_worlds RLS: allow reading public worlds
CREATE POLICY "Anyone can view public worlds" ON public.user_worlds
  FOR SELECT TO authenticated USING (is_public = true OR user_id = auth.uid());

-- Allow world structures to be read for public worlds
CREATE POLICY "Read structures of public worlds" ON public.world_structures
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_worlds w 
      WHERE w.id = world_id AND (w.is_public = true OR w.user_id = auth.uid())
    )
  );

-- Trigger to increment visitor count
CREATE OR REPLACE FUNCTION public.increment_world_visitor_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE user_worlds SET visitor_count = visitor_count + 1 WHERE id = NEW.world_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_world_visit_insert
  AFTER INSERT ON public.world_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_world_visitor_count();

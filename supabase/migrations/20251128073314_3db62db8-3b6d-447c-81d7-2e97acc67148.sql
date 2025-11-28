-- Create table for storing child photos at different ages
CREATE TABLE public.child_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.celestial_children(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  age_at_photo INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(child_id, age_at_photo)
);

-- Enable RLS
ALTER TABLE public.child_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for child_photos
CREATE POLICY "Users can view their own child photos"
  ON public.child_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own child photos"
  ON public.child_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own child photos"
  ON public.child_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own child photos"
  ON public.child_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for storing memorable moments/milestones
CREATE TABLE public.child_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.celestial_children(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  age_at_milestone INTEGER NOT NULL,
  milestone_type TEXT NOT NULL, -- e.g., 'first_words', 'first_steps', 'conversation', 'birthday'
  title TEXT NOT NULL,
  description TEXT,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.child_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for child_milestones
CREATE POLICY "Users can view their own child milestones"
  ON public.child_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own child milestones"
  ON public.child_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own child milestones"
  ON public.child_milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own child milestones"
  ON public.child_milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_child_photos_child_id ON public.child_photos(child_id);
CREATE INDEX idx_child_photos_age ON public.child_photos(age_at_photo);
CREATE INDEX idx_child_milestones_child_id ON public.child_milestones(child_id);
CREATE INDEX idx_child_milestones_age ON public.child_milestones(age_at_milestone);
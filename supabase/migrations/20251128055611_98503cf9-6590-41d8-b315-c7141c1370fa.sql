-- Create celestial children table
CREATE TABLE IF NOT EXISTS public.celestial_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth TIMESTAMP WITH TIME ZONE NOT NULL,
  time_of_birth TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  newborn_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create celestial pregnancies table
CREATE TABLE IF NOT EXISTS public.celestial_pregnancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'trimester_1' CHECK (current_stage IN ('trimester_1', 'trimester_2', 'labor', 'complete')),
  trimester_1_image_url TEXT,
  trimester_2_image_url TEXT,
  labor_image_urls TEXT[], -- Array of labor image URLs
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_complete BOOLEAN DEFAULT false NOT NULL,
  child_id UUID REFERENCES public.celestial_children(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.celestial_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celestial_pregnancies ENABLE ROW LEVEL SECURITY;

-- RLS policies for celestial_children
CREATE POLICY "Users can view their own celestial children"
  ON public.celestial_children FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own celestial children"
  ON public.celestial_children FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own celestial children"
  ON public.celestial_children FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own celestial children"
  ON public.celestial_children FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for celestial_pregnancies
CREATE POLICY "Users can view their own pregnancies"
  ON public.celestial_pregnancies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pregnancies"
  ON public.celestial_pregnancies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pregnancies"
  ON public.celestial_pregnancies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pregnancies"
  ON public.celestial_pregnancies FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_celestial_children_user_id ON public.celestial_children(user_id);
CREATE INDEX idx_celestial_pregnancies_user_id ON public.celestial_pregnancies(user_id);
CREATE INDEX idx_celestial_pregnancies_due_date ON public.celestial_pregnancies(due_date);
CREATE INDEX idx_celestial_pregnancies_complete ON public.celestial_pregnancies(is_complete);

-- Trigger to update updated_at
CREATE TRIGGER update_celestial_pregnancies_updated_at
  BEFORE UPDATE ON public.celestial_pregnancies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
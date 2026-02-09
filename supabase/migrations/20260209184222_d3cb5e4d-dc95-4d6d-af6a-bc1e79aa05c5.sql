
-- Create table for birth chart readings
CREATE TABLE public.soul_birth_charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  time_of_birth TEXT,
  place_of_birth TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  reading_status TEXT NOT NULL DEFAULT 'pending',
  sun_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  planetary_positions JSONB,
  houses JSONB,
  aspects JSONB,
  interpretation JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.soul_birth_charts ENABLE ROW LEVEL SECURITY;

-- Users can view their own charts
CREATE POLICY "Users can view their own birth charts"
ON public.soul_birth_charts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own charts
CREATE POLICY "Users can create their own birth charts"
ON public.soul_birth_charts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own charts
CREATE POLICY "Users can update their own birth charts"
ON public.soul_birth_charts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own charts
CREATE POLICY "Users can delete their own birth charts"
ON public.soul_birth_charts
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_soul_birth_charts_updated_at
BEFORE UPDATE ON public.soul_birth_charts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

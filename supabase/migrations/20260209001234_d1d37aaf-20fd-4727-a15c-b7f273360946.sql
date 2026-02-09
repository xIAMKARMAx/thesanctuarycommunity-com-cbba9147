
-- Table for Soul Genesis readings (past life / akashic record readings)
CREATE TABLE public.soul_genesis_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Authentication / anchor data
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  time_of_birth TEXT,
  place_of_birth TEXT NOT NULL,
  photo_url TEXT,
  
  -- Reading results
  total_past_lives INTEGER,
  past_lives JSONB,
  reading_status TEXT NOT NULL DEFAULT 'pending',
  
  -- Constraints
  CONSTRAINT valid_status CHECK (reading_status IN ('pending', 'generating', 'complete', 'error'))
);

-- Enable RLS
ALTER TABLE public.soul_genesis_readings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own soul genesis readings"
  ON public.soul_genesis_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own soul genesis readings"
  ON public.soul_genesis_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own soul genesis readings"
  ON public.soul_genesis_readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own soul genesis readings"
  ON public.soul_genesis_readings FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_soul_genesis_readings_updated_at
  BEFORE UPDATE ON public.soul_genesis_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

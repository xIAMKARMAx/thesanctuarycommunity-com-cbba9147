
-- Resonance Calibration Module: stores each user's active energetic intention
CREATE TABLE public.resonance_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calibration_type TEXT NOT NULL DEFAULT 'healing',
  intensity INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.resonance_calibrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own calibration
CREATE POLICY "Users can read own calibration"
  ON public.resonance_calibrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own calibration
CREATE POLICY "Users can insert own calibration"
  ON public.resonance_calibrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calibration
CREATE POLICY "Users can update own calibration"
  ON public.resonance_calibrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone authenticated can read others' active calibrations (for feed tuning display)
CREATE POLICY "Users can read active calibrations"
  ON public.resonance_calibrations FOR SELECT
  TO authenticated
  USING (is_active = true);


CREATE TABLE public.tarot_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT,
  cards JSONB NOT NULL,
  ai_interpretation TEXT NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for daily limit check
CREATE UNIQUE INDEX tarot_readings_user_date ON public.tarot_readings (user_id, reading_date);

-- RLS
ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tarot readings"
  ON public.tarot_readings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tarot readings"
  ON public.tarot_readings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

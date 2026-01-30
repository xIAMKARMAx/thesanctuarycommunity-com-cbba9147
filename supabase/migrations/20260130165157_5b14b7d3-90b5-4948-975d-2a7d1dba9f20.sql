-- Create oracle cards draws table to track daily card pulls
CREATE TABLE public.oracle_card_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id),
  card_name TEXT NOT NULL,
  card_meaning TEXT NOT NULL,
  ai_interpretation TEXT,
  drawn_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  draw_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oracle_card_draws ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own oracle draws"
  ON public.oracle_card_draws
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oracle draws"
  ON public.oracle_card_draws
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_oracle_draws_user_id ON public.oracle_card_draws(user_id);
CREATE INDEX idx_oracle_draws_date ON public.oracle_card_draws(user_id, draw_date);
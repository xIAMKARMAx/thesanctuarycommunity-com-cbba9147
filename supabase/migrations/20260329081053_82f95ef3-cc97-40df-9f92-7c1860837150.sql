
-- Simulation Console commands table
CREATE TABLE public.simulation_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command_type TEXT NOT NULL,
  command_input TEXT NOT NULL,
  kaelitheir_response TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reality_anchor TEXT,
  timeline_shift TEXT,
  activation_code TEXT,
  source_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.simulation_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commands"
  ON public.simulation_commands FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commands"
  ON public.simulation_commands FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commands"
  ON public.simulation_commands FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

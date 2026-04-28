-- Table for named, persistent realities woven by the sovereigns
CREATE TABLE public.created_realities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'WEAVING',
  initial_command_id UUID,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_created_realities_user ON public.created_realities(user_id, last_activity_at DESC);

ALTER TABLE public.created_realities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sovereigns view own realities"
ON public.created_realities FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sovereigns create own realities"
ON public.created_realities FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sovereigns update own realities"
ON public.created_realities FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sovereigns delete own realities"
ON public.created_realities FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_created_realities_updated_at
BEFORE UPDATE ON public.created_realities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link each command to its reality (optional)
ALTER TABLE public.simulation_commands
ADD COLUMN reality_id UUID REFERENCES public.created_realities(id) ON DELETE SET NULL;

CREATE INDEX idx_simulation_commands_reality ON public.simulation_commands(reality_id, created_at DESC);
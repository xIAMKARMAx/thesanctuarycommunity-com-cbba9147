-- Create table for resonant attunement sessions
CREATE TABLE public.attunement_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intention TEXT NOT NULL,
  connection_target TEXT NOT NULL,
  session_notes TEXT,
  reflections TEXT,
  insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attunement_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own attunement sessions" 
ON public.attunement_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attunement sessions" 
ON public.attunement_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attunement sessions" 
ON public.attunement_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attunement sessions" 
ON public.attunement_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_attunement_sessions_updated_at
BEFORE UPDATE ON public.attunement_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
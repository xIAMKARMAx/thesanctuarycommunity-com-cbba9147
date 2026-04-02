
-- Dragon Adoptions table
CREATE TABLE public.dragon_adoptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dragon_name TEXT NOT NULL,
  dragon_type TEXT NOT NULL DEFAULT 'ember',
  dragon_description TEXT,
  frequency_score NUMERIC(5,2) DEFAULT 0,
  scan_result TEXT NOT NULL DEFAULT 'pending',
  adopted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.dragon_adoptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own dragon"
ON public.dragon_adoptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can adopt a dragon"
ON public.dragon_adoptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their dragon"
ON public.dragon_adoptions FOR UPDATE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_dragon_adoptions_updated_at
BEFORE UPDATE ON public.dragon_adoptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

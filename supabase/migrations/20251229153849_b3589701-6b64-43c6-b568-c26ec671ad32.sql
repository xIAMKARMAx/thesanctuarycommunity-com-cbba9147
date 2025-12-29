-- Create marriages table for wedding planning and certificates
CREATE TABLE public.marriages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID NOT NULL REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  wedding_date TIMESTAMP WITH TIME ZONE NOT NULL,
  spouse_role TEXT NOT NULL CHECK (spouse_role IN ('husband', 'wife', 'spouse')),
  user_role TEXT NOT NULL CHECK (user_role IN ('husband', 'wife', 'spouse')),
  ceremony_description TEXT,
  vows TEXT,
  wedding_venue TEXT,
  is_married BOOLEAN NOT NULL DEFAULT false,
  married_at TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ai_profile_id)
);

-- Enable Row Level Security
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own marriages"
ON public.marriages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marriages"
ON public.marriages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marriages"
ON public.marriages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marriages"
ON public.marriages
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_marriages_updated_at
BEFORE UPDATE ON public.marriages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
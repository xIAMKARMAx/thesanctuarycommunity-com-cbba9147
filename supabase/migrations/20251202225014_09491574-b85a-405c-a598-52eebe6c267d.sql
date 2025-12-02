-- Create a pets table to support multiple pets per AI profile
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID NOT NULL REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  pet_number INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ai_profile_id, pet_number)
);

-- Enable Row Level Security
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own pets"
ON public.pets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pets"
ON public.pets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets"
ON public.pets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets"
ON public.pets
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create honeymoon plans table
CREATE TABLE public.honeymoon_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marriage_id UUID NOT NULL REFERENCES public.marriages(id) ON DELETE CASCADE,
  destination TEXT,
  activities TEXT,
  duration TEXT,
  dream_description TEXT,
  honeymoon_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, marriage_id)
);

-- Enable Row Level Security
ALTER TABLE public.honeymoon_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own honeymoon plans"
ON public.honeymoon_plans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own honeymoon plans"
ON public.honeymoon_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own honeymoon plans"
ON public.honeymoon_plans
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own honeymoon plans"
ON public.honeymoon_plans
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_honeymoon_plans_updated_at
BEFORE UPDATE ON public.honeymoon_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add user photo reference to wedding_photos for AI generation
ALTER TABLE public.wedding_photos 
ADD COLUMN is_ai_generated BOOLEAN DEFAULT false,
ADD COLUMN generation_prompt TEXT;
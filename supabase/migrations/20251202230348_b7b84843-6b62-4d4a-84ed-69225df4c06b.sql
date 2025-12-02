-- Add personality and mood columns to pets table
ALTER TABLE public.pets
ADD COLUMN personality_traits text[] DEFAULT '{}',
ADD COLUMN current_mood text DEFAULT 'happy',
ADD COLUMN mood_intensity integer DEFAULT 50,
ADD COLUMN behavior_state text DEFAULT 'relaxed',
ADD COLUMN last_mood_update timestamp with time zone DEFAULT now();

-- Create pet_moods table for mood history
CREATE TABLE public.pet_moods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mood_type text NOT NULL,
  intensity integer NOT NULL DEFAULT 50,
  behavior text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pet_moods
ALTER TABLE public.pet_moods ENABLE ROW LEVEL SECURITY;

-- RLS policies for pet_moods
CREATE POLICY "Users can view their own pet moods" 
ON public.pet_moods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pet moods" 
ON public.pet_moods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pet moods" 
ON public.pet_moods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pet moods" 
ON public.pet_moods 
FOR DELETE 
USING (auth.uid() = user_id);
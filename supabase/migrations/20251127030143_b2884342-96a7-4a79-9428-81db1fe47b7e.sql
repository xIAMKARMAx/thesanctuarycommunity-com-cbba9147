-- Create mood_ratings table
CREATE TABLE public.mood_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation_mood UNIQUE(conversation_id)
);

-- Enable RLS
ALTER TABLE public.mood_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for mood_ratings
CREATE POLICY "Users can view their own mood ratings"
ON public.mood_ratings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood ratings"
ON public.mood_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood ratings"
ON public.mood_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood ratings"
ON public.mood_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_mood_ratings_user_created ON public.mood_ratings(user_id, created_at DESC);
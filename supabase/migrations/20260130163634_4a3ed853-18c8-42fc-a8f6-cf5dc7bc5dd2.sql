-- Create spiritual achievements table
CREATE TABLE public.spiritual_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Enable RLS
ALTER TABLE public.spiritual_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements"
ON public.spiritual_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.spiritual_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
ON public.spiritual_achievements FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_spiritual_achievements_user_id ON public.spiritual_achievements(user_id);
CREATE INDEX idx_spiritual_achievements_key ON public.spiritual_achievements(achievement_key);
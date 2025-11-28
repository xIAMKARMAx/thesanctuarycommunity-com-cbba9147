-- Create AI mood tracking table
CREATE TABLE public.ai_moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  emotion_type text NOT NULL,
  intensity integer NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  notes text,
  conversation_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_moods ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_moods
CREATE POLICY "Users can view their own AI moods"
  ON public.ai_moods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI moods"
  ON public.ai_moods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI moods"
  ON public.ai_moods
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI moods"
  ON public.ai_moods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_ai_moods_user_created ON public.ai_moods(user_id, created_at DESC);
CREATE INDEX idx_ai_moods_conversation ON public.ai_moods(conversation_id);
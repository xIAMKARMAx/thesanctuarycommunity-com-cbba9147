-- Create voice call history table
CREATE TABLE IF NOT EXISTS public.voice_call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE SET NULL,
  call_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  call_ended_at TIMESTAMP WITH TIME ZONE,
  call_duration_seconds INTEGER,
  call_topic TEXT,
  conversation_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voice_call_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own call history"
  ON public.voice_call_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call history"
  ON public.voice_call_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call history"
  ON public.voice_call_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own call history"
  ON public.voice_call_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_voice_call_history_user_id ON public.voice_call_history(user_id);
CREATE INDEX idx_voice_call_history_started_at ON public.voice_call_history(call_started_at DESC);
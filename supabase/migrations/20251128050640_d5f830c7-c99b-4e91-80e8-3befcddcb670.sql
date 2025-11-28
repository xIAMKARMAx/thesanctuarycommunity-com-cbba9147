-- Create table for AI room and avatar settings
CREATE TABLE IF NOT EXISTS public.ai_room_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_description TEXT,
  room_image_url TEXT,
  avatar_gender TEXT CHECK (avatar_gender IN ('male', 'female')),
  avatar_description TEXT,
  avatar_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_room_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI room settings"
  ON public.ai_room_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI room settings"
  ON public.ai_room_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI room settings"
  ON public.ai_room_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_room_settings_updated_at
  BEFORE UPDATE ON public.ai_room_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
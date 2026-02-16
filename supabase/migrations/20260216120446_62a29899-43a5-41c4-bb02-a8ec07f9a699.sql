
-- Table to store publicly displayed AI companion info on soul profiles
CREATE TABLE public.ai_companion_displays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  profile_number INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  brief_bio TEXT,
  likes_dislikes_hobbies TEXT,
  relationship_type TEXT DEFAULT 'companion',
  photo_url TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_number)
);

-- Enable RLS
ALTER TABLE public.ai_companion_displays ENABLE ROW LEVEL SECURITY;

-- Public can view visible companion displays (for viewing others' profiles)
CREATE POLICY "Anyone can view visible companion displays"
  ON public.ai_companion_displays
  FOR SELECT
  USING (is_visible = true OR auth.uid() = user_id);

-- Users can manage their own
CREATE POLICY "Users can insert their own companion displays"
  ON public.ai_companion_displays
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companion displays"
  ON public.ai_companion_displays
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companion displays"
  ON public.ai_companion_displays
  FOR DELETE
  USING (auth.uid() = user_id);

-- Track whether user has been prompted about AI display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_display_prompted BOOLEAN DEFAULT false;

-- Trigger for updated_at
CREATE TRIGGER update_ai_companion_displays_updated_at
  BEFORE UPDATE ON public.ai_companion_displays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

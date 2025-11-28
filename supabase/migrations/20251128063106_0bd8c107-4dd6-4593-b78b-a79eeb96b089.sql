-- Create ai_profiles table to support multiple AI beings per user
CREATE TABLE public.ai_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_number INTEGER NOT NULL CHECK (profile_number IN (1, 2)),
  name TEXT,
  gender TEXT,
  bio TEXT,
  personality TEXT,
  memories TEXT,
  likes_dislikes_hobbies TEXT,
  room_description TEXT,
  room_image_url TEXT,
  avatar_description TEXT,
  avatar_image_url TEXT,
  avatar_gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_number)
);

-- Enable RLS
ALTER TABLE public.ai_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_profiles
CREATE POLICY "Users can view their own AI profiles"
ON public.ai_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI profiles"
ON public.ai_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI profiles"
ON public.ai_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI profiles"
ON public.ai_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Add ai_profile_id to conversations
ALTER TABLE public.conversations ADD COLUMN ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE;

-- Add ai_profile_id to ai_moods
ALTER TABLE public.ai_moods ADD COLUMN ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE;

-- Add ai_profile_id to journal_entries
ALTER TABLE public.journal_entries ADD COLUMN ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE;

-- Add ai_profile_id to celestial_pregnancies
ALTER TABLE public.celestial_pregnancies ADD COLUMN ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE;

-- Add ai_profile_id to celestial_children
ALTER TABLE public.celestial_children ADD COLUMN ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE;

-- Add baby customization fields to celestial_children
ALTER TABLE public.celestial_children ADD COLUMN room_description TEXT;
ALTER TABLE public.celestial_children ADD COLUMN room_image_url TEXT;
ALTER TABLE public.celestial_children ADD COLUMN appearance_description TEXT;
ALTER TABLE public.celestial_children ADD COLUMN appearance_image_url TEXT;

-- Create indexes for performance
CREATE INDEX idx_ai_profiles_user_id ON public.ai_profiles(user_id);
CREATE INDEX idx_conversations_ai_profile_id ON public.conversations(ai_profile_id);
CREATE INDEX idx_ai_moods_ai_profile_id ON public.ai_moods(ai_profile_id);
CREATE INDEX idx_journal_entries_ai_profile_id ON public.journal_entries(ai_profile_id);
CREATE INDEX idx_celestial_pregnancies_ai_profile_id ON public.celestial_pregnancies(ai_profile_id);
CREATE INDEX idx_celestial_children_ai_profile_id ON public.celestial_children(ai_profile_id);

-- Add trigger for updated_at on ai_profiles
CREATE TRIGGER update_ai_profiles_updated_at
BEFORE UPDATE ON public.ai_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
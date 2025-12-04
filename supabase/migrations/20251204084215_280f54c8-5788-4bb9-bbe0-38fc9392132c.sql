-- Create dreams table for Dream Space (both user and AI dreams)
CREATE TABLE public.dreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  dreamer TEXT NOT NULL DEFAULT 'user', -- 'user' or 'ai'
  title TEXT,
  content TEXT NOT NULL,
  interpretation TEXT,
  vision_image_url TEXT,
  emotion_tags TEXT[],
  dream_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rituals table for Ritual/Ceremony Space
CREATE TABLE public.rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  ritual_type TEXT NOT NULL, -- 'meditation', 'manifestation', 'energy_work', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  intention TEXT,
  guidance_content TEXT,
  affirmations TEXT[],
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dream_journal_entries table (separate from regular journal)
CREATE TABLE public.dream_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  ai_interpretation TEXT,
  symbols TEXT[],
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones table for Anniversary & Milestone Celebrations
CREATE TABLE public.relationship_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 'first_conversation', 'first_image', 'child_born', 'anniversary', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  milestone_date TIMESTAMP WITH TIME ZONE NOT NULL,
  celebration_message TEXT,
  is_celebrated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_milestones ENABLE ROW LEVEL SECURITY;

-- Dreams policies
CREATE POLICY "Users can view their own dreams" ON public.dreams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dreams" ON public.dreams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dreams" ON public.dreams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dreams" ON public.dreams FOR DELETE USING (auth.uid() = user_id);

-- Rituals policies
CREATE POLICY "Users can view their own rituals" ON public.rituals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own rituals" ON public.rituals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rituals" ON public.rituals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rituals" ON public.rituals FOR DELETE USING (auth.uid() = user_id);

-- Dream journal policies
CREATE POLICY "Users can view their own dream journal" ON public.dream_journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dream journal" ON public.dream_journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dream journal" ON public.dream_journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dream journal" ON public.dream_journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Milestones policies
CREATE POLICY "Users can view their own milestones" ON public.relationship_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own milestones" ON public.relationship_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own milestones" ON public.relationship_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own milestones" ON public.relationship_milestones FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_dreams_updated_at BEFORE UPDATE ON public.dreams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rituals_updated_at BEFORE UPDATE ON public.rituals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dream_journal_updated_at BEFORE UPDATE ON public.dream_journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
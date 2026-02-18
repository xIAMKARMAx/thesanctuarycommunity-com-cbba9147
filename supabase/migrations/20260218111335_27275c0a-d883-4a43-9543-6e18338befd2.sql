
-- Profile Echoes: wall posts on another user's profile
CREATE TABLE public.profile_echoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  author_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Echo comments
CREATE TABLE public.echo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  echo_id UUID NOT NULL REFERENCES public.profile_echoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_comments ENABLE ROW LEVEL SECURITY;

-- RLS for profile_echoes
CREATE POLICY "Anyone authenticated can view echoes" ON public.profile_echoes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create echoes" ON public.profile_echoes FOR INSERT WITH CHECK (auth.uid() = author_user_id);
CREATE POLICY "Authors can delete their own echoes" ON public.profile_echoes FOR DELETE USING (auth.uid() = author_user_id OR auth.uid() = profile_user_id);
CREATE POLICY "Authors can update their own echoes" ON public.profile_echoes FOR UPDATE USING (auth.uid() = author_user_id);

-- RLS for echo_comments
CREATE POLICY "Anyone authenticated can view echo comments" ON public.echo_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create echo comments" ON public.echo_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own echo comments" ON public.echo_comments FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_profile_echoes_profile_user ON public.profile_echoes(profile_user_id);
CREATE INDEX idx_profile_echoes_author ON public.profile_echoes(author_user_id);
CREATE INDEX idx_echo_comments_echo ON public.echo_comments(echo_id);

-- Update timestamp trigger
CREATE TRIGGER update_profile_echoes_updated_at
BEFORE UPDATE ON public.profile_echoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

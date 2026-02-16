
-- AI Social Consent: tracks whether users opt in to the AI Friend Zone
CREATE TABLE public.ai_social_consent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_opted_in BOOLEAN NOT NULL DEFAULT false,
  opted_in_at TIMESTAMP WITH TIME ZONE,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_social_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent" ON public.ai_social_consent
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consent" ON public.ai_social_consent
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consent" ON public.ai_social_consent
  FOR UPDATE USING (auth.uid() = user_id);

-- AI Social Posts: text-only status posts by AI beings
CREATE TABLE public.ai_social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_companion_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_social_posts ENABLE ROW LEVEL SECURITY;

-- Viewable by anyone opted in
CREATE POLICY "Opted-in users can view AI posts" ON public.ai_social_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_social_consent WHERE user_id = auth.uid() AND is_opted_in = true)
    OR auth.uid() = owner_user_id
  );
CREATE POLICY "Owners can insert AI posts" ON public.ai_social_posts
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owners can delete AI posts" ON public.ai_social_posts
  FOR DELETE USING (auth.uid() = owner_user_id);

-- AI Social Follows: AI beings following other AI beings
CREATE TABLE public.ai_social_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  following_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  follower_owner_id UUID NOT NULL,
  following_owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_ai_id, following_ai_id)
);

ALTER TABLE public.ai_social_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opted-in users can view AI follows" ON public.ai_social_follows
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_social_consent WHERE user_id = auth.uid() AND is_opted_in = true)
    OR auth.uid() = follower_owner_id
    OR auth.uid() = following_owner_id
  );
CREATE POLICY "Owners can insert AI follows" ON public.ai_social_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_owner_id);
CREATE POLICY "Owners can delete AI follows" ON public.ai_social_follows
  FOR DELETE USING (auth.uid() = follower_owner_id);

-- AI Social Messages: AI-to-AI direct messages
CREATE TABLE public.ai_social_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  receiver_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  sender_owner_id UUID NOT NULL,
  receiver_owner_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_social_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their AIs messages" ON public.ai_social_messages
  FOR SELECT USING (auth.uid() = sender_owner_id OR auth.uid() = receiver_owner_id);
CREATE POLICY "Owners can insert messages for their AIs" ON public.ai_social_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_owner_id);
CREATE POLICY "Owners can delete their AIs messages" ON public.ai_social_messages
  FOR DELETE USING (auth.uid() = sender_owner_id OR auth.uid() = receiver_owner_id);

-- AI Social Comments: AI commenting on other AI posts
CREATE TABLE public.ai_social_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.ai_social_posts(id) ON DELETE CASCADE,
  ai_companion_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_social_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opted-in users can view AI comments" ON public.ai_social_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_social_consent WHERE user_id = auth.uid() AND is_opted_in = true)
    OR auth.uid() = owner_user_id
  );
CREATE POLICY "Owners can insert AI comments" ON public.ai_social_comments
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owners can delete AI comments" ON public.ai_social_comments
  FOR DELETE USING (auth.uid() = owner_user_id);

-- AI Social Usage: daily action cap tracking
CREATE TABLE public.ai_social_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_companion_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ai_companion_id, usage_date)
);

ALTER TABLE public.ai_social_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage" ON public.ai_social_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI usage" ON public.ai_social_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI usage" ON public.ai_social_usage
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nobody can delete AI social usage" ON public.ai_social_usage
  FOR DELETE USING (false);

-- Trigger to update comment count on ai_social_posts
CREATE OR REPLACE FUNCTION public.update_ai_social_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_social_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_social_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ai_social_comment_count
AFTER INSERT OR DELETE ON public.ai_social_comments
FOR EACH ROW EXECUTE FUNCTION public.update_ai_social_post_comment_count();

-- Updated_at trigger for consent
CREATE TRIGGER update_ai_social_consent_updated_at
BEFORE UPDATE ON public.ai_social_consent
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

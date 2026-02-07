
-- ==========================================
-- PHASE 3: Mentorship, Story Circles, Rituals
-- ==========================================

-- 1. MENTORSHIP MATCHING
-- Mentorship profiles (users opt-in as mentor/mentee)
CREATE TABLE public.mentorship_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_preference TEXT NOT NULL DEFAULT 'both', -- 'mentor', 'mentee', 'both'
  journey_stage TEXT NOT NULL DEFAULT 'seeker', -- 'seeker', 'awakening', 'anchoring', 'guide', 'ascended'
  focus_areas TEXT[] DEFAULT '{}',
  experience_summary TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.mentorship_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active mentorship profiles" ON public.mentorship_profiles
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.mentorship_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.mentorship_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.mentorship_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Mentorship connections
CREATE TABLE public.mentorship_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'declined'
  focus_area TEXT,
  compatibility_score INTEGER DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

ALTER TABLE public.mentorship_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.mentorship_connections
  FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);
CREATE POLICY "Users can request mentorship" ON public.mentorship_connections
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Participants can update connection" ON public.mentorship_connections
  FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);
CREATE POLICY "Participants can delete connection" ON public.mentorship_connections
  FOR DELETE USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- 2. STORY CIRCLES
CREATE TABLE public.story_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'healing', -- 'healing', 'shadow_work', 'gratitude', 'forgiveness', 'rebirth'
  max_participants INTEGER NOT NULL DEFAULT 8,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.story_circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active circles" ON public.story_circles
  FOR SELECT USING (is_active = true OR auth.uid() = creator_id);
CREATE POLICY "Users can create circles" ON public.story_circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update circles" ON public.story_circles
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete circles" ON public.story_circles
  FOR DELETE USING (auth.uid() = creator_id);

-- Story circle members
CREATE TABLE public.story_circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.story_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'facilitator', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

ALTER TABLE public.story_circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view circle members" ON public.story_circle_members
  FOR SELECT USING (true);
CREATE POLICY "Users can join circles" ON public.story_circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave circles" ON public.story_circle_members
  FOR DELETE USING (auth.uid() = user_id);

-- Story circle shares (vulnerability posts within a circle)
CREATE TABLE public.story_circle_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.story_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  holding_count INTEGER NOT NULL DEFAULT 0, -- "I hold space for you" reactions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.story_circle_shares ENABLE ROW LEVEL SECURITY;

-- Only circle members can see shares (check membership)
CREATE POLICY "Circle members can view shares" ON public.story_circle_shares
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.story_circle_members WHERE circle_id = story_circle_shares.circle_id AND user_id = auth.uid())
    OR auth.uid() = user_id
  );
CREATE POLICY "Circle members can share" ON public.story_circle_shares
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.story_circle_members WHERE circle_id = story_circle_shares.circle_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own shares" ON public.story_circle_shares
  FOR DELETE USING (auth.uid() = user_id);

-- Holdings (reactions to shares)
CREATE TABLE public.story_circle_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.story_circle_shares(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(share_id, user_id)
);

ALTER TABLE public.story_circle_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view holdings" ON public.story_circle_holdings
  FOR SELECT USING (true);
CREATE POLICY "Users can hold space" ON public.story_circle_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove holding" ON public.story_circle_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger: update holding count
CREATE OR REPLACE FUNCTION public.update_holding_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.story_circle_shares SET holding_count = holding_count + 1 WHERE id = NEW.share_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.story_circle_shares SET holding_count = GREATEST(0, holding_count - 1) WHERE id = OLD.share_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_share_holding_count
  AFTER INSERT OR DELETE ON public.story_circle_holdings
  FOR EACH ROW EXECUTE FUNCTION public.update_holding_count();

-- Trigger: update member count
CREATE OR REPLACE FUNCTION public.update_circle_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.story_circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.story_circles SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.circle_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_story_circle_member_count
  AFTER INSERT OR DELETE ON public.story_circle_members
  FOR EACH ROW EXECUTE FUNCTION public.update_circle_member_count();

-- 3. COMMUNITY RITUALS (Real-time ceremonies)
CREATE TABLE public.community_rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ritual_type TEXT NOT NULL DEFAULT 'meditation', -- 'meditation', 'breathwork', 'chanting', 'visualization', 'ceremony'
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_live BOOLEAN NOT NULL DEFAULT false,
  participant_count INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rituals" ON public.community_rituals
  FOR SELECT USING (true);
CREATE POLICY "Users can create rituals" ON public.community_rituals
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update rituals" ON public.community_rituals
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete rituals" ON public.community_rituals
  FOR DELETE USING (auth.uid() = creator_id);

-- Ritual participants
CREATE TABLE public.ritual_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ritual_id UUID NOT NULL REFERENCES public.community_rituals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  reflection TEXT,
  UNIQUE(ritual_id, user_id)
);

ALTER TABLE public.ritual_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.ritual_participants
  FOR SELECT USING (true);
CREATE POLICY "Users can join rituals" ON public.ritual_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.ritual_participants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rituals" ON public.ritual_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger: update participant count
CREATE OR REPLACE FUNCTION public.update_ritual_participant_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_rituals SET participant_count = participant_count + 1 WHERE id = NEW.ritual_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_rituals SET participant_count = GREATEST(0, participant_count - 1) WHERE id = OLD.ritual_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_community_ritual_participant_count
  AFTER INSERT OR DELETE ON public.ritual_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_ritual_participant_count();

-- Enable realtime for live ritual participation
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritual_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_rituals;

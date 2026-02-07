
-- Synchronicity Tracker
CREATE TABLE public.synchronicities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'number',
  title TEXT NOT NULL,
  description TEXT,
  pattern TEXT,
  frequency INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.synchronicities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all synchronicities" ON public.synchronicities
FOR SELECT USING (true);
CREATE POLICY "Users can insert own synchronicities" ON public.synchronicities
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own synchronicities" ON public.synchronicities
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own synchronicities" ON public.synchronicities
FOR DELETE USING (auth.uid() = user_id);

-- Matrix Glitch Reports
CREATE TABLE public.matrix_glitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  glitch_type TEXT NOT NULL DEFAULT 'deja_vu',
  location TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  upvote_count INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.matrix_glitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view glitches" ON public.matrix_glitches
FOR SELECT USING (true);
CREATE POLICY "Users can insert own glitches" ON public.matrix_glitches
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own glitches" ON public.matrix_glitches
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own glitches" ON public.matrix_glitches
FOR DELETE USING (auth.uid() = user_id);

-- Glitch Upvotes
CREATE TABLE public.glitch_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  glitch_id UUID NOT NULL REFERENCES public.matrix_glitches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(glitch_id, user_id)
);

ALTER TABLE public.glitch_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes" ON public.glitch_upvotes
FOR SELECT USING (true);
CREATE POLICY "Users can insert own upvotes" ON public.glitch_upvotes
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own upvotes" ON public.glitch_upvotes
FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update upvote count
CREATE OR REPLACE FUNCTION public.update_glitch_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.matrix_glitches SET upvote_count = upvote_count + 1 WHERE id = NEW.glitch_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.matrix_glitches SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.glitch_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_glitch_upvotes
AFTER INSERT OR DELETE ON public.glitch_upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_glitch_upvote_count();

-- Daily Collective Intention
CREATE TABLE public.collective_intentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intention_text TEXT NOT NULL,
  intention_date DATE NOT NULL DEFAULT CURRENT_DATE,
  proposed_by UUID NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(intention_date, intention_text)
);

ALTER TABLE public.collective_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view intentions" ON public.collective_intentions
FOR SELECT USING (true);
CREATE POLICY "Users can propose intentions" ON public.collective_intentions
FOR INSERT WITH CHECK (auth.uid() = proposed_by);
CREATE POLICY "Users can update own intentions" ON public.collective_intentions
FOR UPDATE USING (auth.uid() = proposed_by);

-- Intention Votes
CREATE TABLE public.intention_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intention_id UUID NOT NULL REFERENCES public.collective_intentions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(intention_id, user_id)
);

ALTER TABLE public.intention_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.intention_votes
FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.intention_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.intention_votes
FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update vote count
CREATE OR REPLACE FUNCTION public.update_intention_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collective_intentions SET vote_count = vote_count + 1 WHERE id = NEW.intention_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collective_intentions SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.intention_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_intention_votes
AFTER INSERT OR DELETE ON public.intention_votes
FOR EACH ROW EXECUTE FUNCTION public.update_intention_vote_count();

-- Intention Participants (people meditating on today's intention)
CREATE TABLE public.intention_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intention_id UUID NOT NULL REFERENCES public.collective_intentions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(intention_id, user_id)
);

ALTER TABLE public.intention_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.intention_participants
FOR SELECT USING (true);
CREATE POLICY "Users can join" ON public.intention_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON public.intention_participants
FOR DELETE USING (auth.uid() = user_id);

-- Awakening Milestones
CREATE TABLE public.awakening_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT NOT NULL DEFAULT 'realization',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.awakening_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public milestones viewable by all" ON public.awakening_milestones
FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.awakening_milestones
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.awakening_milestones
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON public.awakening_milestones
FOR DELETE USING (auth.uid() = user_id);

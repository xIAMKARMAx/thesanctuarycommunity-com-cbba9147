
-- Art Showcase Submissions
CREATE TABLE public.art_showcase_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_art_of_month BOOLEAN NOT NULL DEFAULT false,
  art_of_month_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Art Showcase Votes (1-5 stars)
CREATE TABLE public.art_showcase_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.art_showcase_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

-- Art Showcase Comments
CREATE TABLE public.art_showcase_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.art_showcase_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.art_showcase_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_showcase_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_showcase_comments ENABLE ROW LEVEL SECURITY;

-- Submissions: anyone can read, authenticated users can insert their own, owners can delete
CREATE POLICY "Anyone can view submissions" ON public.art_showcase_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create submissions" ON public.art_showcase_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own submissions" ON public.art_showcase_submissions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.art_showcase_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Votes: anyone can read, authenticated can insert/delete their own
CREATE POLICY "Anyone can view votes" ON public.art_showcase_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can vote" ON public.art_showcase_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.art_showcase_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.art_showcase_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments: anyone can read, authenticated can insert, owners can delete
CREATE POLICY "Anyone can view comments" ON public.art_showcase_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can comment" ON public.art_showcase_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.art_showcase_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to update average_rating and total_votes on submissions when votes change
CREATE OR REPLACE FUNCTION public.update_showcase_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.art_showcase_submissions
    SET average_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.art_showcase_votes WHERE submission_id = OLD.submission_id), 0),
        total_votes = (SELECT COUNT(*) FROM public.art_showcase_votes WHERE submission_id = OLD.submission_id),
        updated_at = now()
    WHERE id = OLD.submission_id;
    RETURN OLD;
  ELSE
    UPDATE public.art_showcase_submissions
    SET average_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.art_showcase_votes WHERE submission_id = NEW.submission_id), 0),
        total_votes = (SELECT COUNT(*) FROM public.art_showcase_votes WHERE submission_id = NEW.submission_id),
        updated_at = now()
    WHERE id = NEW.submission_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER update_showcase_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.art_showcase_votes
FOR EACH ROW EXECUTE FUNCTION public.update_showcase_rating();

-- Trigger to update comment_count
CREATE OR REPLACE FUNCTION public.update_showcase_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.art_showcase_submissions SET comment_count = comment_count + 1 WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.art_showcase_submissions SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_showcase_comment_count_trigger
AFTER INSERT OR DELETE ON public.art_showcase_comments
FOR EACH ROW EXECUTE FUNCTION public.update_showcase_comment_count();

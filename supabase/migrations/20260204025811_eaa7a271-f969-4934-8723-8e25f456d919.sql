-- =====================================================
-- THE CONSCIOUS COLLECTIVE NETWORK - PHASE 1 MVP
-- =====================================================

-- 1. Soul Profiles - Extended spiritual community profiles
CREATE TABLE public.soul_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  soul_title TEXT, -- e.g., "Lightworker", "Starseed", "Healer"
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  spiritual_journey TEXT, -- Brief journey description
  gifts_and_talents TEXT[], -- Array of spiritual gifts
  seeking TEXT[], -- What they're seeking in community
  location TEXT, -- Optional location
  website_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Community Posts - Shared insights, experiences, sacred updates
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'insight', -- insight, experience, question, gratitude, vision
  visibility TEXT NOT NULL DEFAULT 'public', -- public, followers, private
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  blessing_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Post Blessings - Reactions (love, light, gratitude, wisdom, healing)
CREATE TABLE public.post_blessings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  blessing_type TEXT NOT NULL DEFAULT 'love', -- love, light, gratitude, wisdom, healing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id) -- One blessing per user per post
);

-- 4. Post Comments - Discussions on posts
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  blessing_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Follows - Soul-to-soul connections
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id) -- Can't follow yourself
);

-- 6. Comment Blessings - Reactions on comments
CREATE TABLE public.comment_blessings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  blessing_type TEXT NOT NULL DEFAULT 'love',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_soul_profiles_user_id ON public.soul_profiles(user_id);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_visibility ON public.community_posts(visibility);
CREATE INDEX idx_post_blessings_post_id ON public.post_blessings(post_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Soul Profiles RLS
ALTER TABLE public.soul_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.soul_profiles FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.soul_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.soul_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.soul_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Community Posts RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are viewable by everyone"
ON public.community_posts FOR SELECT
USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
ON public.community_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.community_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.community_posts FOR DELETE
USING (auth.uid() = user_id);

-- Post Blessings RLS
ALTER TABLE public.post_blessings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blessings are viewable by everyone"
ON public.post_blessings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can bless posts"
ON public.post_blessings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own blessings"
ON public.post_blessings FOR DELETE
USING (auth.uid() = user_id);

-- Post Comments RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Follows RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
ON public.follows FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow others"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- Comment Blessings RLS
ALTER TABLE public.comment_blessings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment blessings are viewable by everyone"
ON public.comment_blessings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can bless comments"
ON public.comment_blessings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their comment blessings"
ON public.comment_blessings FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS FOR COUNTER UPDATES
-- =====================================================

-- Function to update blessing count on posts
CREATE OR REPLACE FUNCTION public.update_post_blessing_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET blessing_count = blessing_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET blessing_count = GREATEST(0, blessing_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_post_blessing_count
AFTER INSERT OR DELETE ON public.post_blessings
FOR EACH ROW EXECUTE FUNCTION public.update_post_blessing_count();

-- Function to update comment count on posts
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- Function to update blessing count on comments
CREATE OR REPLACE FUNCTION public.update_comment_blessing_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments
    SET blessing_count = blessing_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments
    SET blessing_count = GREATEST(0, blessing_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_comment_blessing_count
AFTER INSERT OR DELETE ON public.comment_blessings
FOR EACH ROW EXECUTE FUNCTION public.update_comment_blessing_count();

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_soul_profiles_updated_at
BEFORE UPDATE ON public.soul_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
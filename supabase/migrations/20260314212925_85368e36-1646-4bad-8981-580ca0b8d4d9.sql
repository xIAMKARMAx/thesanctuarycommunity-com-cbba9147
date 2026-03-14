
-- Twin Flame Scan results table
CREATE TABLE public.twin_flame_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'twin_flame',
  intention TEXT,
  energetic_signature TEXT,
  recognition_signs TEXT,
  attraction_guidance TEXT,
  soul_connection_type TEXT,
  full_reading TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.twin_flame_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scans" ON public.twin_flame_scans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON public.twin_flame_scans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Synchronicity Wall posts table
CREATE TABLE public.synchronicity_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  synchronicity_type TEXT NOT NULL DEFAULT 'general',
  blessing_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.synchronicity_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read synchronicities" ON public.synchronicity_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own synchronicities" ON public.synchronicity_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own synchronicities" ON public.synchronicity_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Synchronicity blessings (likes)
CREATE TABLE public.synchronicity_blessings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.synchronicity_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.synchronicity_blessings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read blessings" ON public.synchronicity_blessings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own blessings" ON public.synchronicity_blessings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blessings" ON public.synchronicity_blessings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Wisdom Exchange posts (forums)
CREATE TABLE public.wisdom_exchange_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'higher_self',
  resonance_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wisdom_exchange_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read wisdom posts" ON public.wisdom_exchange_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own wisdom posts" ON public.wisdom_exchange_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wisdom posts" ON public.wisdom_exchange_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Wisdom Exchange comments
CREATE TABLE public.wisdom_exchange_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.wisdom_exchange_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wisdom_exchange_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read wisdom comments" ON public.wisdom_exchange_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own wisdom comments" ON public.wisdom_exchange_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Manifestation Groups
CREATE TABLE public.manifestation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  intention TEXT NOT NULL,
  max_members INT NOT NULL DEFAULT 12,
  member_count INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.manifestation_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read groups" ON public.manifestation_groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert groups" ON public.manifestation_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own groups" ON public.manifestation_groups
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- Group Members
CREATE TABLE public.manifestation_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.manifestation_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.manifestation_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read members" ON public.manifestation_group_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join groups" ON public.manifestation_group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.manifestation_group_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Group Intentions (shared affirmations/entries)
CREATE TABLE public.manifestation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.manifestation_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'affirmation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.manifestation_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group entries" ON public.manifestation_entries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.manifestation_group_members WHERE group_id = manifestation_entries.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert entries" ON public.manifestation_entries
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.manifestation_group_members WHERE group_id = manifestation_entries.group_id AND user_id = auth.uid())
  );

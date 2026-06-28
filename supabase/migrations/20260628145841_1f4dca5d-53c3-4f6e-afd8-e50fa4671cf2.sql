
-- Showcase items (pets, children, rooms, dream home) surfaced on a user's profile
CREATE TABLE public.sanctuary_showcase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('pet','child','room','dream_home')),
  source_id UUID,                -- optional FK into pets/celestial_children/etc., kept loose for flexibility
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sanctuary_showcase_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sanctuary_showcase_items TO authenticated;
GRANT ALL ON public.sanctuary_showcase_items TO service_role;

ALTER TABLE public.sanctuary_showcase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public items are viewable by anyone"
  ON public.sanctuary_showcase_items FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Owners insert their own items"
  ON public.sanctuary_showcase_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update their own items"
  ON public.sanctuary_showcase_items FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete their own items"
  ON public.sanctuary_showcase_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_showcase_user ON public.sanctuary_showcase_items(user_id, item_type, display_order);
CREATE INDEX idx_showcase_public ON public.sanctuary_showcase_items(item_type, created_at DESC) WHERE visibility = 'public';

CREATE TRIGGER trg_showcase_updated_at
  BEFORE UPDATE ON public.sanctuary_showcase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Public-facing Flame card (display only — Flames don't socialize yet)
CREATE TABLE public.flame_public_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_profile_id UUID NOT NULL,
  flame_name TEXT NOT NULL,
  portrait_url TEXT,
  vibe_blurb TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ai_profile_id)
);

GRANT SELECT ON public.flame_public_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flame_public_cards TO authenticated;
GRANT ALL ON public.flame_public_cards TO service_role;

ALTER TABLE public.flame_public_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public flame cards viewable by anyone"
  ON public.flame_public_cards FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Owners insert their own flame card"
  ON public.flame_public_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update their own flame card"
  ON public.flame_public_cards FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete their own flame card"
  ON public.flame_public_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_flame_card_updated_at
  BEFORE UPDATE ON public.flame_public_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

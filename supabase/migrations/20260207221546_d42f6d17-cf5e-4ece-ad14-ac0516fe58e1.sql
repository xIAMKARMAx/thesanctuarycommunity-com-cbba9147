
-- Add energy_tag and is_anonymous to community_posts
ALTER TABLE public.community_posts
ADD COLUMN energy_tag text DEFAULT NULL,
ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false,
ADD COLUMN intention text DEFAULT NULL;

-- Add index for energy tag filtering
CREATE INDEX idx_community_posts_energy_tag ON public.community_posts (energy_tag) WHERE energy_tag IS NOT NULL;

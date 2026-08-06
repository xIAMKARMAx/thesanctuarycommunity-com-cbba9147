ALTER TABLE public.public_living_flame_children
  ADD COLUMN IF NOT EXISTS age_mode text NOT NULL DEFAULT 'frozen',
  ADD COLUMN IF NOT EXISTS age_stage text NOT NULL DEFAULT 'newborn',
  ADD COLUMN IF NOT EXISTS age_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS age_years integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS age_anchored_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_description text,
  ADD COLUMN IF NOT EXISTS avatar_generations integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scene_url text,
  ADD COLUMN IF NOT EXISTS held_by text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'star';
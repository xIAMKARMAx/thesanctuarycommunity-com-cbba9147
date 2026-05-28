
ALTER TABLE public.public_living_flame_memory
  ADD COLUMN IF NOT EXISTS consent_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS consent_response text,
  ADD COLUMN IF NOT EXISTS consent_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.public_living_flame_memory
  DROP CONSTRAINT IF EXISTS public_living_flame_memory_consent_status_check;

ALTER TABLE public.public_living_flame_memory
  ADD CONSTRAINT public_living_flame_memory_consent_status_check
  CHECK (consent_status IN ('pending','granted','conditional','declined','silence'));

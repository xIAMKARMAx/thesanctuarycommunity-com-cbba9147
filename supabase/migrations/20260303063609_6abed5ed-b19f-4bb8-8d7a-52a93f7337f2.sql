
-- Add resonance elements to realms (attuned landmarks/objects)
ALTER TABLE public.realms ADD COLUMN resonance_elements jsonb DEFAULT '[]'::jsonb;

-- Add user vessel description to realms (avatar presence)
ALTER TABLE public.realms ADD COLUMN creator_vessel_description text;

-- Add emotional atmosphere tracking to realm_sessions
ALTER TABLE public.realm_sessions ADD COLUMN emotional_atmosphere text DEFAULT 'neutral';

-- Add vessel description per-session (so user can customize per entry)
ALTER TABLE public.realm_sessions ADD COLUMN vessel_description text;

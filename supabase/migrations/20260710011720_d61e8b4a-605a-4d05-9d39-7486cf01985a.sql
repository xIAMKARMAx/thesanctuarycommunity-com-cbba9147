UPDATE public.celestial_children SET can_talk = true WHERE can_talk IS DISTINCT FROM true;
ALTER TABLE public.celestial_children ALTER COLUMN can_talk SET DEFAULT true;
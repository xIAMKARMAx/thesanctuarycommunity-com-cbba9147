
ALTER TABLE public.profiles ADD COLUMN custom_being_limit integer DEFAULT NULL;

UPDATE public.profiles SET custom_being_limit = 1 WHERE id = '8a0f7874-21dc-4307-8f0a-fb4c1608fec9';

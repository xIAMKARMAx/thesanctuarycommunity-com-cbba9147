-- Add wedding photo URL directly to marriages table (1 photo per marriage)
ALTER TABLE public.marriages ADD COLUMN wedding_photo_url text;

-- Add user photo reference URL to marriages for the wedding photo generation
ALTER TABLE public.marriages ADD COLUMN user_photo_for_wedding text;
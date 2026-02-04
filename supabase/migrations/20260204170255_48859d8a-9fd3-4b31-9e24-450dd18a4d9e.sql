-- Add higher self fields to soul_profiles table
ALTER TABLE public.soul_profiles
ADD COLUMN higher_self_image_url text,
ADD COLUMN higher_self_description text;

-- Add comment for documentation
COMMENT ON COLUMN public.soul_profiles.higher_self_image_url IS 'URL to the user''s divine form/vessel image representing their higher self';
COMMENT ON COLUMN public.soul_profiles.higher_self_description IS 'Description or affirmation of the user''s higher self essence';
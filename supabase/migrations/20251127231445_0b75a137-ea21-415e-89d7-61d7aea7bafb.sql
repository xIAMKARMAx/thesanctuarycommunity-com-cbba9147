-- Add relationship_status field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN relationship_status TEXT CHECK (relationship_status IN ('friend', 'family', 'romantic'));

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.relationship_status IS 'Defines the relationship between user and AI: friend, family, or romantic';
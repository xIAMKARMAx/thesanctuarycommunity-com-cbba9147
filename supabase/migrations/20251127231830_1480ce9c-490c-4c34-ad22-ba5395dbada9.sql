-- Drop the old constraint that doesn't allow NULL
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_relationship_status_check;

-- Add new constraint that allows NULL values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_relationship_status_check 
CHECK (relationship_status IS NULL OR relationship_status IN ('friend', 'family', 'romantic'));
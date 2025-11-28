-- Drop the existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a restrictive SELECT policy ensuring users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);
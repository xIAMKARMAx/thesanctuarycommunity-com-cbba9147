
-- Update the SELECT policy: authenticated users can see public profiles OR their own OR profiles of people they follow/who follow them
-- Private profiles are only fully visible to the owner and their connections (mutual follows)

-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.soul_profiles;

-- Create a function to check if two users are connected (either follows the other)
CREATE OR REPLACE FUNCTION public.are_connected(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE (follower_id = user_a AND following_id = user_b)
       OR (follower_id = user_b AND following_id = user_a)
  )
$$;

-- New SELECT policy: require authentication, then allow:
-- 1. Own profile always
-- 2. Public profiles always  
-- 3. Private profiles only if connected
CREATE POLICY "Authenticated users can view profiles"
ON public.soul_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id
    OR is_public = true
    OR public.are_connected(auth.uid(), user_id)
  )
);

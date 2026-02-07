
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;

-- Create a restrictive SELECT policy: users can only see follows they're part of
CREATE POLICY "Users can view their own follows"
ON public.follows
FOR SELECT
USING (auth.uid() = follower_id OR auth.uid() = following_id);

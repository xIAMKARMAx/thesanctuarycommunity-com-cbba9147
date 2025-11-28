-- Add DELETE policy for profiles table allowing users to delete their own account
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);
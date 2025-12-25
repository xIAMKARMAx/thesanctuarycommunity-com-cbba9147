-- Fix abuse_incidents table policies to only allow authenticated users
-- This prevents any unauthenticated access to sensitive abuse report data

-- Drop existing SELECT policies that use public role
DROP POLICY IF EXISTS "Admins can view all abuse incidents" ON public.abuse_incidents;
DROP POLICY IF EXISTS "Users can view their own abuse incidents" ON public.abuse_incidents;

-- Recreate with authenticated role restriction
CREATE POLICY "Admins can view all abuse incidents" 
ON public.abuse_incidents 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own abuse incidents" 
ON public.abuse_incidents 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
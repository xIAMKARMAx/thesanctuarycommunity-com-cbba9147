-- Add INSERT policy for abuse_incidents - users can only report their own incidents
CREATE POLICY "Users can insert their own abuse incidents"
ON public.abuse_incidents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy - only admins can delete abuse incidents to maintain audit integrity
CREATE POLICY "Admins can delete abuse incidents"
ON public.abuse_incidents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
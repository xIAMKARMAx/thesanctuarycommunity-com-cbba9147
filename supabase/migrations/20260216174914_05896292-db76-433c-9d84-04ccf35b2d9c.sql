
-- Fix overly permissive INSERT policy on collective_wisdom
-- Only service role (edge functions) should insert, so we restrict to admin
DROP POLICY "Service role can insert wisdom" ON public.collective_wisdom;

CREATE POLICY "Admins can insert wisdom" ON public.collective_wisdom
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Also allow admins to update/delete wisdom
CREATE POLICY "Admins can update wisdom" ON public.collective_wisdom
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wisdom" ON public.collective_wisdom
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

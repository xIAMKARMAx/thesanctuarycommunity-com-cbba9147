-- Remove the overly permissive INSERT policy
-- Service role keys bypass RLS, so edge functions can still insert messages
DROP POLICY IF EXISTS "System can insert spontaneous messages" ON public.spontaneous_messages;

-- Note: No INSERT policy needed - only service role (via edge functions) should create messages

-- Drop the overly permissive policy
DROP POLICY "Service can manage autonomous conversations" ON public.ai_autonomous_conversations;

-- No insert/update/delete policy for authenticated users - only service role can write
-- Service role bypasses RLS entirely, so no policy needed for it

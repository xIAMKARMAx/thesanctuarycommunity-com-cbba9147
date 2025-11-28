-- Remove the unsafe INSERT policy that allows anyone to insert
DROP POLICY IF EXISTS "System can insert mood notifications" ON public.mood_notifications;
DROP POLICY IF EXISTS "System can insert spontaneous messages" ON public.spontaneous_messages;

-- No INSERT policy needed - service role bypasses RLS
-- The send-spontaneous-message edge function should use service role key to insert
-- Regular users should never be able to insert spontaneous messages
-- Add INSERT policy for mood_notifications
-- Service role bypasses RLS, but this provides validation layer
-- Ensures if users somehow attempt insert, they can only insert for themselves
CREATE POLICY "System can insert mood notifications"
ON public.mood_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);
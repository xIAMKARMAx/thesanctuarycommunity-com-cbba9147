-- Add DELETE policy for mood_notifications table
-- Allows users to delete their own notifications
CREATE POLICY "Users can delete their own mood notifications"
ON public.mood_notifications
FOR DELETE
USING (auth.uid() = user_id);
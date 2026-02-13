-- Fix overly permissive INSERT policies on server-generated tables
-- Service role bypasses RLS entirely, so these policies only need to handle authenticated users

-- 1. higher_self_downloads
DROP POLICY IF EXISTS "Service role can insert downloads" ON public.higher_self_downloads;
CREATE POLICY "Users can receive their own downloads"
ON public.higher_self_downloads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. mood_notifications
DROP POLICY IF EXISTS "Service role can insert mood notifications" ON public.mood_notifications;
CREATE POLICY "Users can receive their own mood notifications"
ON public.mood_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. spontaneous_messages
DROP POLICY IF EXISTS "Service role can insert spontaneous messages" ON public.spontaneous_messages;
CREATE POLICY "Users can receive their own spontaneous messages"
ON public.spontaneous_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
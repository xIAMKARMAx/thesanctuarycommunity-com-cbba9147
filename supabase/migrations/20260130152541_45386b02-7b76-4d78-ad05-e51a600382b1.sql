-- SECURITY FORTIFICATION: Prevent limit manipulation and add missing protections

-- 1. Add INSERT policy for spontaneous_messages (service role only - edge functions)
-- Note: This table should only have records inserted by the system via service role
CREATE POLICY "Service role can insert spontaneous messages"
ON public.spontaneous_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Add INSERT policy for mood_notifications (service role only)
CREATE POLICY "Service role can insert mood notifications"
ON public.mood_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Prevent users from deleting their own usage/cooldown records (limit bypass protection)
-- Revoke DELETE on usage tracking tables if any public grants exist
REVOKE DELETE ON public.image_generation_usage FROM anon, authenticated;
REVOKE DELETE ON public.free_user_limits FROM anon, authenticated;
REVOKE DELETE ON public.chat_cooldowns FROM anon, authenticated;
REVOKE DELETE ON public.group_chat_usage FROM anon, authenticated;

-- 4. Add explicit DENY policies for DELETE on these tables (belt and suspenders)
CREATE POLICY "Nobody can delete image generation usage"
ON public.image_generation_usage
FOR DELETE
USING (false);

CREATE POLICY "Nobody can delete free user limits"
ON public.free_user_limits
FOR DELETE
USING (false);

CREATE POLICY "Nobody can delete chat cooldowns"
ON public.chat_cooldowns
FOR DELETE
USING (false);

CREATE POLICY "Nobody can delete group chat usage"
ON public.group_chat_usage
FOR DELETE
USING (false);
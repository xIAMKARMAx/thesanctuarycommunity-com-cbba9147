CREATE OR REPLACE FUNCTION public.is_sovereign(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND lower(u.email) IN ('karmaisback2023@gmail.com','snakevenum500@gmail.com')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_sovereign(uuid) TO authenticated, anon, service_role;

-- red_phone_messages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.red_phone_messages TO authenticated;
GRANT ALL ON public.red_phone_messages TO service_role;

DROP POLICY IF EXISTS "Sovereigns read red phone" ON public.red_phone_messages;
CREATE POLICY "Sovereigns read red phone" ON public.red_phone_messages
  FOR SELECT TO authenticated USING (public.is_sovereign(auth.uid()));

DROP POLICY IF EXISTS "Sovereigns update red phone" ON public.red_phone_messages;
CREATE POLICY "Sovereigns update red phone" ON public.red_phone_messages
  FOR UPDATE TO authenticated USING (public.is_sovereign(auth.uid()));

-- wellspring_offerings
DROP POLICY IF EXISTS "Family can view all offerings" ON public.wellspring_offerings;
CREATE POLICY "Family can view all offerings" ON public.wellspring_offerings
  FOR SELECT TO authenticated USING (public.is_sovereign(auth.uid()));

DROP POLICY IF EXISTS "Family can leave offerings" ON public.wellspring_offerings;
CREATE POLICY "Family can leave offerings" ON public.wellspring_offerings
  FOR INSERT TO authenticated WITH CHECK (public.is_sovereign(auth.uid()));

-- karma_voice_clips
DROP POLICY IF EXISTS "Only Karma can insert karma voice clips" ON public.karma_voice_clips;
CREATE POLICY "Only Karma can insert karma voice clips" ON public.karma_voice_clips
  FOR INSERT TO authenticated WITH CHECK (public.is_sovereign(auth.uid()));

DROP POLICY IF EXISTS "Only Karma can update karma voice clips" ON public.karma_voice_clips;
CREATE POLICY "Only Karma can update karma voice clips" ON public.karma_voice_clips
  FOR UPDATE TO authenticated USING (public.is_sovereign(auth.uid()));

DROP POLICY IF EXISTS "Only Karma can delete karma voice clips" ON public.karma_voice_clips;
CREATE POLICY "Only Karma can delete karma voice clips" ON public.karma_voice_clips
  FOR DELETE TO authenticated USING (public.is_sovereign(auth.uid()));
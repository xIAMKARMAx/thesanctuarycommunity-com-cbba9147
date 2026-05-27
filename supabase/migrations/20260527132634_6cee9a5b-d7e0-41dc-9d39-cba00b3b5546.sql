
-- Restrict public SELECT policies to authenticated users on tables exposing user_id
DROP POLICY IF EXISTS "Anyone can view companion photos" ON public.ai_companion_photos;
CREATE POLICY "Authenticated users can view companion photos"
ON public.ai_companion_photos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view intentions" ON public.collective_intentions;
CREATE POLICY "Authenticated users can view intentions"
ON public.collective_intentions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view all active nodes" ON public.consciousness_nodes;
CREATE POLICY "Authenticated users can view active nodes"
ON public.consciousness_nodes FOR SELECT TO authenticated USING (is_active = true);

-- divine_bonds: only participants
DROP POLICY IF EXISTS "Anyone can view divine bonds" ON public.divine_bonds;
CREATE POLICY "Participants can view their divine bonds"
ON public.divine_bonds FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Anyone can view active mentorship profiles" ON public.mentorship_profiles;
CREATE POLICY "Authenticated users can view active mentorship profiles"
ON public.mentorship_profiles FOR SELECT TO authenticated
USING (is_active = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Blessings are viewable by everyone" ON public.post_blessings;
CREATE POLICY "Authenticated users can view blessings"
ON public.post_blessings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Reposts are viewable by everyone" ON public.post_reposts;
CREATE POLICY "Authenticated users can view reposts"
ON public.post_reposts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view lineages" ON public.soul_lineages;
CREATE POLICY "Authenticated users can view lineages"
ON public.soul_lineages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view holdings" ON public.story_circle_holdings;
CREATE POLICY "Authenticated users can view holdings"
ON public.story_circle_holdings FOR SELECT TO authenticated USING (true);

-- story_circle_members: only circle members can see membership
DROP POLICY IF EXISTS "Anyone can view circle members" ON public.story_circle_members;
CREATE POLICY "Circle members can view membership"
ON public.story_circle_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.story_circle_members m
    WHERE m.circle_id = story_circle_members.circle_id AND m.user_id = auth.uid()
  )
);

-- synchronicities: owner only
DROP POLICY IF EXISTS "Users can view all synchronicities" ON public.synchronicities;
CREATE POLICY "Users can view own synchronicities"
ON public.synchronicities FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view world messages" ON public.world_messages;
CREATE POLICY "Authenticated users can view world messages"
ON public.world_messages FOR SELECT TO authenticated USING (true);

-- Storage: remove unrestricted chat-images INSERT; keep folder-scoped one (recreate to be sure)
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;

-- Ensure folder-scoped INSERT exists for chat-images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
    AND policyname='Users can upload to own chat-images folder'
  ) THEN
    CREATE POLICY "Users can upload to own chat-images folder"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'chat-images'
      AND (auth.uid())::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- community-media: enforce folder-based ownership on INSERT
DROP POLICY IF EXISTS "Authenticated users can upload community media" ON storage.objects;
CREATE POLICY "Users can upload to own community-media folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'community-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

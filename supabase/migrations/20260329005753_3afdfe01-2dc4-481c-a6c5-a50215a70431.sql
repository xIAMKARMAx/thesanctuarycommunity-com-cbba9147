CREATE POLICY "Users can insert own synchronicity posts"
ON public.synchronicity_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
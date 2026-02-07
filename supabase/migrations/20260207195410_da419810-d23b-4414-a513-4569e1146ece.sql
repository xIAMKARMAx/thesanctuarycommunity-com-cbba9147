
DROP POLICY IF EXISTS "Comment blessings are viewable by everyone" ON public.comment_blessings;

CREATE POLICY "Users can view their own comment blessings"
ON public.comment_blessings
FOR SELECT
USING (auth.uid() = user_id);

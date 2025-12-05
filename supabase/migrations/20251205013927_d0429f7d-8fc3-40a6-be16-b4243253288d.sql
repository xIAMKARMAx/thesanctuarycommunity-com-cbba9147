-- Drop the existing restrictive INSERT policy on messages
DROP POLICY IF EXISTS "Users can create their own messages" ON public.messages;

-- Create a permissive INSERT policy for messages
CREATE POLICY "Users can create their own messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure other message policies are permissive (recreate them)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
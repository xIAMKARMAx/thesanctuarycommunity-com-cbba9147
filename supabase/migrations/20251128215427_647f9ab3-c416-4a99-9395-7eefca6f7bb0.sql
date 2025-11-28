-- Add INSERT policy for spontaneous_messages table
-- This allows the system (via service role in edge functions) to create AI-generated messages
CREATE POLICY "System can insert spontaneous messages"
ON public.spontaneous_messages
FOR INSERT
WITH CHECK (true);
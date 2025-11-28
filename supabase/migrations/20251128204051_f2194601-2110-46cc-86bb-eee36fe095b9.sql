-- Add INSERT policy for spontaneous_messages to allow system to create messages
CREATE POLICY "System can insert spontaneous messages"
ON public.spontaneous_messages
FOR INSERT
WITH CHECK (true);
-- Add ai_profile_id to spontaneous_messages to track which being sent the message
ALTER TABLE public.spontaneous_messages 
ADD COLUMN ai_profile_id uuid REFERENCES public.ai_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_spontaneous_messages_ai_profile ON public.spontaneous_messages(ai_profile_id);
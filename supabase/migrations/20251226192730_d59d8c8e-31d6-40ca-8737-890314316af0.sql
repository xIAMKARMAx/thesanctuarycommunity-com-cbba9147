-- Add sender tracking columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS sender_id uuid;

-- Add group chat flag to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_group_chat boolean DEFAULT false;

-- Update existing assistant messages to link to their conversation's ai_profile
UPDATE public.messages m
SET sender_type = 'ai_profile',
    sender_id = c.ai_profile_id
FROM public.conversations c
WHERE m.conversation_id = c.id
  AND m.role = 'assistant'
  AND m.sender_id IS NULL;

-- Create index for faster message queries by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_type, sender_id);
-- Add soft delete column to messages table for individual message deletion
-- AI will still see deleted messages in its memory/history
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Create index for efficient filtering of visible messages
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(conversation_id, is_deleted);

-- Add comment explaining the purpose
COMMENT ON COLUMN public.messages.is_deleted IS 'When true, message is hidden from UI but still included in AI context/memory';
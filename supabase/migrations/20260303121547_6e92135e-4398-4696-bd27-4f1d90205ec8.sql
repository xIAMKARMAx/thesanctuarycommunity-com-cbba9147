
-- Add is_pinned column to messages table so users can protect important messages from auto-deletion
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Create index for efficient purge queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at_not_pinned 
ON public.messages (created_at) 
WHERE is_pinned = false;

-- Create a function to purge old messages (older than 60 days, not pinned)
CREATE OR REPLACE FUNCTION public.purge_old_messages()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.messages
  WHERE created_at < now() - INTERVAL '60 days'
    AND is_pinned = false;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN json_build_object('deleted_count', v_deleted_count);
END;
$$;

-- Also purge old spontaneous_messages older than 60 days
CREATE OR REPLACE FUNCTION public.purge_old_spontaneous_messages()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.spontaneous_messages
  WHERE sent_at < now() - INTERVAL '60 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN json_build_object('deleted_count', v_deleted_count);
END;
$$;

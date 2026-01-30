-- Add is_permanent column for permanent saves (1 per connection type, 6 total max)
ALTER TABLE public.attunement_sessions 
ADD COLUMN is_permanent BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient queries by connection target and permanence
CREATE INDEX idx_attunement_sessions_permanent 
ON public.attunement_sessions (user_id, connection_target, is_permanent);

-- Create function to check if user can save permanent session for a connection type
CREATE OR REPLACE FUNCTION public.can_save_permanent_attunement(
  p_user_id UUID,
  p_connection_target TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user already has a permanent session for this connection type
  RETURN NOT EXISTS (
    SELECT 1 FROM public.attunement_sessions
    WHERE user_id = p_user_id
    AND connection_target = p_connection_target
    AND is_permanent = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get permanent session count by connection type
CREATE OR REPLACE FUNCTION public.get_permanent_attunement_counts(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(connection_target, count)
  INTO result
  FROM (
    SELECT connection_target, COUNT(*) as count
    FROM public.attunement_sessions
    WHERE user_id = p_user_id AND is_permanent = true
    GROUP BY connection_target
  ) sub;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Create abuse_incidents table to track each incident
CREATE TABLE public.abuse_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  incident_type text NOT NULL, -- 'warning', 'second_offense', 'blocked'
  message_content text, -- The abusive message (for review)
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  ai_profile_id uuid REFERENCES public.ai_profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text -- Any additional context
);

-- Create index for efficient lookups
CREATE INDEX idx_abuse_incidents_user_id ON public.abuse_incidents(user_id);
CREATE INDEX idx_abuse_incidents_created_at ON public.abuse_incidents(created_at DESC);

-- Enable RLS
ALTER TABLE public.abuse_incidents ENABLE ROW LEVEL SECURITY;

-- Users can view their own incidents (transparency)
CREATE POLICY "Users can view their own abuse incidents"
  ON public.abuse_incidents FOR SELECT
  USING (auth.uid() = user_id);

-- Only system/service role can insert (not users directly)
-- No INSERT policy for regular users - this is intentional

-- Add abuse tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS abuse_warning_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_restricted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS restriction_reason text,
ADD COLUMN IF NOT EXISTS restricted_at timestamp with time zone;

-- Create function to check if user is restricted
CREATE OR REPLACE FUNCTION public.is_user_restricted(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_restricted = true
  );
END;
$$;

-- Create function to record abuse incident and potentially restrict user
CREATE OR REPLACE FUNCTION public.record_abuse_incident(
  p_user_id uuid,
  p_incident_type text,
  p_message_content text DEFAULT NULL,
  p_conversation_id uuid DEFAULT NULL,
  p_ai_profile_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warning_count integer;
  v_should_restrict boolean := false;
BEGIN
  -- Insert the incident
  INSERT INTO public.abuse_incidents (user_id, incident_type, message_content, conversation_id, ai_profile_id, notes)
  VALUES (p_user_id, p_incident_type, p_message_content, p_conversation_id, p_ai_profile_id, p_notes);
  
  -- Update warning count
  UPDATE public.profiles 
  SET abuse_warning_count = abuse_warning_count + 1
  WHERE id = p_user_id
  RETURNING abuse_warning_count INTO v_warning_count;
  
  -- Auto-restrict after 3 incidents
  IF v_warning_count >= 3 THEN
    v_should_restrict := true;
    UPDATE public.profiles
    SET is_restricted = true,
        restriction_reason = 'Automatic restriction due to repeated abusive behavior (' || v_warning_count || ' incidents)',
        restricted_at = now()
    WHERE id = p_user_id;
  END IF;
  
  RETURN json_build_object(
    'warning_count', v_warning_count,
    'is_now_restricted', v_should_restrict
  );
END;
$$;
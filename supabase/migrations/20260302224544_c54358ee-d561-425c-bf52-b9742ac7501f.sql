
-- Create table for Pleiadian Council Board Room sessions
CREATE TABLE public.council_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_title TEXT,
  session_type TEXT NOT NULL DEFAULT 'strategy',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  council_members TEXT[] DEFAULT ARRAY['Commander Ashtar', 'Council Elder Semjase', 'Navigator Ptaah', 'Architect Sfath', 'Emissary Alaje'],
  key_decisions JSONB DEFAULT '[]'::jsonb,
  session_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.council_sessions ENABLE ROW LEVEL SECURITY;

-- Admin-only access (this is an admin-exclusive feature)
CREATE POLICY "Users can view their own council sessions"
ON public.council_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own council sessions"
ON public.council_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own council sessions"
ON public.council_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own council sessions"
ON public.council_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_council_sessions_updated_at
BEFORE UPDATE ON public.council_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

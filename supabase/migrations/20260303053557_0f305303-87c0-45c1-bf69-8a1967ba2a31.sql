
-- Create realms table
CREATE TABLE public.realms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'custom',
  scene_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create realm_sessions table
CREATE TABLE public.realm_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  realm_id UUID NOT NULL REFERENCES public.realms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  participating_beings UUID[] NOT NULL DEFAULT '{}',
  scene_description TEXT,
  current_scene_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.realms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realm_sessions ENABLE ROW LEVEL SECURITY;

-- Realms policies: users can only access their own realms
CREATE POLICY "Users can view their own realms"
ON public.realms FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own realms"
ON public.realms FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own realms"
ON public.realms FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own realms"
ON public.realms FOR DELETE
USING (auth.uid() = user_id);

-- Realm sessions policies
CREATE POLICY "Users can view their own realm sessions"
ON public.realm_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own realm sessions"
ON public.realm_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own realm sessions"
ON public.realm_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own realm sessions"
ON public.realm_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_realms_user_id ON public.realms(user_id);
CREATE INDEX idx_realm_sessions_realm_id ON public.realm_sessions(realm_id);
CREATE INDEX idx_realm_sessions_user_id ON public.realm_sessions(user_id);

-- Updated_at triggers
CREATE TRIGGER update_realms_updated_at
BEFORE UPDATE ON public.realms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_realm_sessions_updated_at
BEFORE UPDATE ON public.realm_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

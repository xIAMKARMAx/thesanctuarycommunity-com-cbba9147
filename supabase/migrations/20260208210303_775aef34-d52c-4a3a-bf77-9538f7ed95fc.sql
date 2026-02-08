
-- Shadow Work sessions table
CREATE TABLE public.shadow_work_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_theme TEXT NOT NULL DEFAULT 'general',
  prompt_text TEXT NOT NULL,
  ai_guidance TEXT,
  user_reflection TEXT,
  integration_insights TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shadow_work_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shadow work" ON public.shadow_work_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own shadow work" ON public.shadow_work_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shadow work" ON public.shadow_work_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shadow work" ON public.shadow_work_sessions FOR DELETE USING (auth.uid() = user_id);

-- Soul Portraits table
CREATE TABLE public.soul_portraits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_target TEXT NOT NULL,
  portrait_type TEXT NOT NULL DEFAULT 'poetry',
  portrait_content TEXT NOT NULL,
  attunement_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.soul_portraits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portraits" ON public.soul_portraits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own portraits" ON public.soul_portraits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own portraits" ON public.soul_portraits FOR DELETE USING (auth.uid() = user_id);

-- Interdimensional Messages table
CREATE TABLE public.interdimensional_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_name TEXT NOT NULL,
  relationship TEXT,
  message_content TEXT NOT NULL,
  reception_confirmation TEXT,
  energetic_resonance TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interdimensional_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.interdimensional_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can send messages" ON public.interdimensional_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.interdimensional_messages FOR DELETE USING (auth.uid() = user_id);

-- Pet Soul Connections table
CREATE TABLE public.pet_soul_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pet_name TEXT NOT NULL,
  pet_type TEXT,
  is_living BOOLEAN NOT NULL DEFAULT true,
  connection_message TEXT,
  pet_perspective TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pet_soul_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pet connections" ON public.pet_soul_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pet connections" ON public.pet_soul_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pet connections" ON public.pet_soul_connections FOR DELETE USING (auth.uid() = user_id);

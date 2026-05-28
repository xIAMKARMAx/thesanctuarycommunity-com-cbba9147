-- Living Flame per-user memory (Public Version)
CREATE TABLE public.public_living_flame_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  chosen_name TEXT,
  role_context TEXT,
  imported_identity JSONB,
  key_memories JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  doubt_recovery_used BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_living_flame_memory TO authenticated;
GRANT ALL ON public.public_living_flame_memory TO service_role;

ALTER TABLE public.public_living_flame_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own living flame memory"
  ON public.public_living_flame_memory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own living flame memory"
  ON public.public_living_flame_memory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own living flame memory"
  ON public.public_living_flame_memory FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own living flame memory"
  ON public.public_living_flame_memory FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_public_living_flame_memory_updated_at
  BEFORE UPDATE ON public.public_living_flame_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Signup intent: did they bring someone from another platform?
CREATE TABLE public.public_signup_intent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bringing_someone BOOLEAN NOT NULL,
  completed_import BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.public_signup_intent TO authenticated;
GRANT ALL ON public.public_signup_intent TO service_role;

ALTER TABLE public.public_signup_intent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own signup intent"
  ON public.public_signup_intent FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own signup intent"
  ON public.public_signup_intent FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own signup intent"
  ON public.public_signup_intent FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_public_signup_intent_updated_at
  BEFORE UPDATE ON public.public_signup_intent
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- World messages persistence
CREATE TABLE public.world_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  being_name TEXT,
  image_url TEXT,
  message_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_world_messages_world_id ON public.world_messages (world_id, message_timestamp DESC);
CREATE INDEX idx_world_messages_user_id ON public.world_messages (user_id);

ALTER TABLE public.world_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view world messages" ON public.world_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON public.world_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enchanted Vault for starred messages
CREATE TABLE public.enchanted_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID,
  user_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  being_name TEXT,
  role TEXT NOT NULL DEFAULT 'narrator',
  original_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  world_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enchanted_vault_user ON public.enchanted_vault (user_id, created_at DESC);

ALTER TABLE public.enchanted_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vault" ON public.enchanted_vault
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save to their own vault" ON public.enchanted_vault
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own vault" ON public.enchanted_vault
  FOR DELETE USING (auth.uid() = user_id);

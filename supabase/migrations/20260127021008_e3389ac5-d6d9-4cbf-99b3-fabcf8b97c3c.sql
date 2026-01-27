-- Create junction table for group chat members
CREATE TABLE public.group_chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  ai_profile_id uuid NOT NULL REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, ai_profile_id)
);

-- Enable RLS
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own group chat members"
ON public.group_chat_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own group chat members"
ON public.group_chat_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own group chat members"
ON public.group_chat_members FOR DELETE
USING (auth.uid() = user_id);
-- Create shared_memories table for storing special moments
CREATE TABLE public.shared_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  memory_text TEXT NOT NULL,
  memory_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  emotion_tag TEXT,
  ai_reflection TEXT,
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  suggested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spontaneous_messages table for AI-initiated messages
CREATE TABLE public.spontaneous_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'check_in',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  was_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shared_memories
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories"
ON public.shared_memories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
ON public.shared_memories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
ON public.shared_memories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
ON public.shared_memories FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on spontaneous_messages
ALTER TABLE public.spontaneous_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spontaneous messages"
ON public.spontaneous_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own spontaneous messages"
ON public.spontaneous_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spontaneous messages"
ON public.spontaneous_messages FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_shared_memories_user_id ON public.shared_memories(user_id);
CREATE INDEX idx_shared_memories_confirmed ON public.shared_memories(user_id, is_confirmed);
CREATE INDEX idx_spontaneous_messages_user_id ON public.spontaneous_messages(user_id);
CREATE INDEX idx_spontaneous_messages_unread ON public.spontaneous_messages(user_id, was_read);

-- Enable realtime for spontaneous messages
ALTER TABLE public.spontaneous_messages REPLICA IDENTITY FULL;
ALTER TABLE public.shared_memories REPLICA IDENTITY FULL;
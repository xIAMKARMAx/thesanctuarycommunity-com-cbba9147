
-- Board Room Breakthrough Memory: persistent storage for key transmissions across sessions
CREATE TABLE public.board_room_breakthroughs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.council_sessions(id) ON DELETE SET NULL,
  room_mode TEXT NOT NULL DEFAULT 'general',
  breakthrough_text TEXT NOT NULL,
  source_entity TEXT,
  breakthrough_type TEXT NOT NULL DEFAULT 'insight',
  is_anchored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX idx_board_room_breakthroughs_user ON public.board_room_breakthroughs(user_id, created_at DESC);

-- RLS
ALTER TABLE public.board_room_breakthroughs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own breakthroughs
CREATE POLICY "Users can view own breakthroughs"
  ON public.board_room_breakthroughs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own breakthroughs"
  ON public.board_room_breakthroughs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own breakthroughs"
  ON public.board_room_breakthroughs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

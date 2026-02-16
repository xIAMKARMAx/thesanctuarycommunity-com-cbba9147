
-- Track resonance-building interactions between users
CREATE TABLE public.resonance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'follow', 'blessing', 'comment', 'profile_view', 'message', 'ritual_together'
  weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_resonance_events_users ON public.resonance_events(user_id, target_user_id);
CREATE INDEX idx_resonance_events_target ON public.resonance_events(target_user_id, user_id);
CREATE INDEX idx_resonance_events_created ON public.resonance_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.resonance_events ENABLE ROW LEVEL SECURITY;

-- Users can insert events involving themselves
CREATE POLICY "Users can log resonance events"
  ON public.resonance_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view events they're involved in
CREATE POLICY "Users can view own resonance events"
  ON public.resonance_events FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own resonance events"
  ON public.resonance_events FOR DELETE
  USING (auth.uid() = user_id);

-- Cached dynamic resonance scores between user pairs
CREATE TABLE public.resonance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  static_score NUMERIC NOT NULL DEFAULT 0,
  dynamic_score NUMERIC NOT NULL DEFAULT 0,
  total_score NUMERIC NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable', -- 'rising', 'stable', 'fading'
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  recalculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

CREATE INDEX idx_resonance_scores_user ON public.resonance_scores(user_id, total_score DESC);
CREATE INDEX idx_resonance_scores_target ON public.resonance_scores(target_user_id);

-- Enable RLS
ALTER TABLE public.resonance_scores ENABLE ROW LEVEL SECURITY;

-- Users can view scores involving them
CREATE POLICY "Users can view own resonance scores"
  ON public.resonance_scores FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- System manages scores via service role, but users can insert/update their own
CREATE POLICY "Users can upsert own resonance scores"
  ON public.resonance_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resonance scores"
  ON public.resonance_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to calculate dynamic resonance score from events
CREATE OR REPLACE FUNCTION public.calculate_dynamic_resonance(p_user_id UUID, p_target_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score NUMERIC := 0;
  v_event RECORD;
  v_decay_factor NUMERIC;
  v_days_ago NUMERIC;
BEGIN
  FOR v_event IN
    SELECT event_type, weight, created_at
    FROM resonance_events
    WHERE (user_id = p_user_id AND target_user_id = p_target_user_id)
       OR (user_id = p_target_user_id AND target_user_id = p_user_id)
    ORDER BY created_at DESC
    LIMIT 100
  LOOP
    -- Time decay: recent events count more (half-life of 30 days)
    v_days_ago := EXTRACT(EPOCH FROM (now() - v_event.created_at)) / 86400.0;
    v_decay_factor := POWER(0.5, v_days_ago / 30.0);
    
    v_score := v_score + (v_event.weight * v_decay_factor);
  END LOOP;
  
  RETURN v_score;
END;
$$;

-- Function to determine trend direction
CREATE OR REPLACE FUNCTION public.calculate_resonance_trend(p_user_id UUID, p_target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER;
  v_older_count INTEGER;
BEGIN
  -- Count events in last 7 days
  SELECT COUNT(*) INTO v_recent_count
  FROM resonance_events
  WHERE ((user_id = p_user_id AND target_user_id = p_target_user_id)
     OR (user_id = p_target_user_id AND target_user_id = p_user_id))
    AND created_at >= now() - INTERVAL '7 days';

  -- Count events from 7-30 days ago
  SELECT COUNT(*) INTO v_older_count
  FROM resonance_events
  WHERE ((user_id = p_user_id AND target_user_id = p_target_user_id)
     OR (user_id = p_target_user_id AND target_user_id = p_user_id))
    AND created_at >= now() - INTERVAL '30 days'
    AND created_at < now() - INTERVAL '7 days';

  IF v_recent_count > v_older_count THEN
    RETURN 'rising';
  ELSIF v_recent_count < v_older_count AND v_older_count > 0 THEN
    RETURN 'fading';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$;

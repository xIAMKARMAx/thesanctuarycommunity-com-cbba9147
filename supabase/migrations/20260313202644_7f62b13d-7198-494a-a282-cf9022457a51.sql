-- Soul Mirror: cached weekly analyses
CREATE TABLE public.soul_mirror_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'growth_patterns', 'core_frequency', 'relationship_reflection'
  content JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Soul Mirror: interactive session usage tracking
CREATE TABLE public.soul_mirror_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INT NOT NULL DEFAULT 1,
  last_prompt TEXT,
  last_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_date)
);

-- RLS
ALTER TABLE public.soul_mirror_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soul_mirror_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own data
CREATE POLICY "Users can read own analyses" ON public.soul_mirror_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.soul_mirror_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.soul_mirror_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read own sessions" ON public.soul_mirror_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.soul_mirror_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.soul_mirror_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_soul_mirror_analyses_user ON public.soul_mirror_analyses(user_id, analysis_type);
CREATE INDEX idx_soul_mirror_sessions_user_date ON public.soul_mirror_sessions(user_id, session_date);
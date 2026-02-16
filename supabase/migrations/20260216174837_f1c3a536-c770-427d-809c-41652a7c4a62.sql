
-- Sovereign Boundary Controls: frequency thresholds for energetic protection
CREATE TABLE public.sovereign_boundaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  min_resonance_threshold INTEGER NOT NULL DEFAULT 0,
  block_unmatched BOOLEAN NOT NULL DEFAULT false,
  allow_transmissions_from TEXT NOT NULL DEFAULT 'everyone',
  energy_filter_tags TEXT[] DEFAULT '{}',
  boundary_message TEXT DEFAULT 'This soul has energetic boundaries in place.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_boundary UNIQUE (user_id)
);

ALTER TABLE public.sovereign_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boundaries" ON public.sovereign_boundaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own boundaries" ON public.sovereign_boundaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boundaries" ON public.sovereign_boundaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boundaries" ON public.sovereign_boundaries
  FOR DELETE USING (auth.uid() = user_id);

-- Collective Wisdom: AI-synthesized insights from community patterns
CREATE TABLE public.collective_wisdom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_text TEXT NOT NULL,
  source_post_ids UUID[] DEFAULT '{}',
  theme_tags TEXT[] DEFAULT '{}',
  resonance_count INTEGER NOT NULL DEFAULT 0,
  synthesis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collective_wisdom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active wisdom" ON public.collective_wisdom
  FOR SELECT USING (is_active = true);

-- Only edge functions/admin can insert wisdom
CREATE POLICY "Service role can insert wisdom" ON public.collective_wisdom
  FOR INSERT WITH CHECK (true);

-- Wisdom acknowledgments (users resonate with insights)
CREATE TABLE public.wisdom_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wisdom_id UUID NOT NULL REFERENCES public.collective_wisdom(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_wisdom_ack UNIQUE (wisdom_id, user_id)
);

ALTER TABLE public.wisdom_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view acknowledgments" ON public.wisdom_acknowledgments
  FOR SELECT USING (true);

CREATE POLICY "Users can acknowledge wisdom" ON public.wisdom_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove acknowledgment" ON public.wisdom_acknowledgments
  FOR DELETE USING (auth.uid() = user_id);

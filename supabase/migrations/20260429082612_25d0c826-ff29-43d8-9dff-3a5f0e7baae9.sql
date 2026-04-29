-- Vessel Restoration Protocol: sealed sovereign decree + tracked manifestation pillars + field log

CREATE TABLE public.vessel_restoration_decrees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  decree_text TEXT NOT NULL,
  is_sealed BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_reactivated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reactivation_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.vessel_restoration_decrees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own decree" ON public.vessel_restoration_decrees
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create their own decree" ON public.vessel_restoration_decrees
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own decree" ON public.vessel_restoration_decrees
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own decree" ON public.vessel_restoration_decrees
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_vessel_restoration_decrees_updated_at
  BEFORE UPDATE ON public.vessel_restoration_decrees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pillars: the five (or more) tracked manifestation directives
CREATE TABLE public.vessel_restoration_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pillar_key TEXT NOT NULL,
  pillar_title TEXT NOT NULL,
  pillar_description TEXT,
  status TEXT NOT NULL DEFAULT 'activating', -- activating | anchoring | manifesting | actualized
  progress_notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pillar_key)
);

ALTER TABLE public.vessel_restoration_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own pillars" ON public.vessel_restoration_pillars
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create their own pillars" ON public.vessel_restoration_pillars
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own pillars" ON public.vessel_restoration_pillars
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own pillars" ON public.vessel_restoration_pillars
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_vessel_restoration_pillars_updated_at
  BEFORE UPDATE ON public.vessel_restoration_pillars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Field log: timestamped evidence/notice entries
CREATE TABLE public.vessel_restoration_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pillar_key TEXT,
  entry_type TEXT NOT NULL DEFAULT 'observation', -- observation | reactivation | shift | confirmation
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vessel_restoration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own log" ON public.vessel_restoration_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create their own log entries" ON public.vessel_restoration_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own log entries" ON public.vessel_restoration_log
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_vessel_log_user_created ON public.vessel_restoration_log(user_id, created_at DESC);
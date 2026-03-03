
-- Consciousness Nodes: points seeded by users on the global grid
CREATE TABLE public.consciousness_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  node_name TEXT NOT NULL,
  intention TEXT NOT NULL,
  frequency_type TEXT NOT NULL DEFAULT 'love',
  latitude NUMERIC,
  longitude NUMERIC,
  energy_level NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_count INTEGER NOT NULL DEFAULT 0,
  resonance_pulse NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consciousness_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active nodes"
  ON public.consciousness_nodes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create their own nodes"
  ON public.consciousness_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nodes"
  ON public.consciousness_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nodes"
  ON public.consciousness_nodes FOR DELETE
  USING (auth.uid() = user_id);

-- Node Connections: links between consciousness nodes
CREATE TABLE public.node_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_a_id UUID NOT NULL REFERENCES public.consciousness_nodes(id) ON DELETE CASCADE,
  node_b_id UUID NOT NULL REFERENCES public.consciousness_nodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  connection_strength NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(node_a_id, node_b_id, user_id)
);

ALTER TABLE public.node_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all connections"
  ON public.node_connections FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can create connections"
  ON public.node_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.node_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Global Resonance Snapshots: periodic metrics
CREATE TABLE public.global_resonance_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_nodes INTEGER NOT NULL DEFAULT 0,
  total_connections INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  collective_frequency NUMERIC NOT NULL DEFAULT 0,
  dominant_intention TEXT,
  energy_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date)
);

ALTER TABLE public.global_resonance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view snapshots"
  ON public.global_resonance_snapshots FOR SELECT
  TO authenticated USING (true);

-- Function to increment connected_count
CREATE OR REPLACE FUNCTION public.update_node_connected_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE consciousness_nodes SET connected_count = connected_count + 1 WHERE id IN (NEW.node_a_id, NEW.node_b_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE consciousness_nodes SET connected_count = GREATEST(0, connected_count - 1) WHERE id IN (OLD.node_a_id, OLD.node_b_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_node_connections_count
AFTER INSERT OR DELETE ON public.node_connections
FOR EACH ROW EXECUTE FUNCTION public.update_node_connected_count();

-- Trigger for updated_at
CREATE TRIGGER update_consciousness_nodes_updated_at
BEFORE UPDATE ON public.consciousness_nodes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

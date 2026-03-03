import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ConsciousnessNode {
  id: string;
  user_id: string;
  node_name: string;
  intention: string;
  frequency_type: string;
  energy_level: number;
  connected_count: number;
  resonance_pulse: number;
  is_active: boolean;
  created_at: string;
}

export interface NodeConnection {
  id: string;
  node_a_id: string;
  node_b_id: string;
  user_id: string;
  connection_strength: number;
  created_at: string;
}

export interface ResonanceSnapshot {
  id: string;
  snapshot_date: string;
  total_nodes: number;
  total_connections: number;
  active_users: number;
  collective_frequency: number;
  dominant_intention: string | null;
  energy_distribution: Record<string, number>;
}

const FREQUENCY_TYPES = [
  "love", "healing", "protection", "wisdom", "abundance",
  "unity", "creativity", "peace", "transformation", "awakening",
] as const;

export type FrequencyType = (typeof FREQUENCY_TYPES)[number];
export { FREQUENCY_TYPES };

export function useConsciousnessNetwork() {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<ConsciousnessNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [snapshot, setSnapshot] = useState<ResonanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setUserId(session.user.id);

    const [nodesRes, connectionsRes, snapshotRes] = await Promise.all([
      supabase.from("consciousness_nodes").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("node_connections").select("*"),
      supabase.from("global_resonance_snapshots").select("*").order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setNodes((nodesRes.data as ConsciousnessNode[]) || []);
    setConnections((connectionsRes.data as NodeConnection[]) || []);
    if (snapshotRes.data) setSnapshot(snapshotRes.data as ResonanceSnapshot);
    setLoading(false);
  };

  const seedNode = useCallback(async (name: string, intention: string, frequencyType: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("consciousness_nodes")
      .insert({ user_id: userId, node_name: name, intention, frequency_type: frequencyType })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to seed node", description: error.message, variant: "destructive" });
      return null;
    }
    setNodes(prev => [data as ConsciousnessNode, ...prev]);
    toast({ title: `✨ Node Seeded: ${name}`, description: intention });
    return data;
  }, [userId, toast]);

  const connectNodes = useCallback(async (nodeAId: string, nodeBId: string) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("node_connections")
      .insert({ node_a_id: nodeAId, node_b_id: nodeBId, user_id: userId })
      .select()
      .single();

    if (error) {
      toast({ title: "Connection failed", description: error.message, variant: "destructive" });
      return;
    }
    setConnections(prev => [...prev, data as NodeConnection]);
    toast({ title: "🔗 Nodes Connected", description: "Quantum entanglement established." });
  }, [userId, toast]);

  const myNodes = nodes.filter(n => n.user_id === userId);
  const otherNodes = nodes.filter(n => n.user_id !== userId);

  // Compute live metrics
  const totalEnergy = nodes.reduce((sum, n) => sum + n.energy_level, 0);
  const frequencyDistribution = nodes.reduce((acc, n) => {
    acc[n.frequency_type] = (acc[n.frequency_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantFrequency = Object.entries(frequencyDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "love";

  return {
    nodes,
    connections,
    snapshot,
    loading,
    userId,
    myNodes,
    otherNodes,
    totalEnergy,
    frequencyDistribution,
    dominantFrequency,
    seedNode,
    connectNodes,
    reload: loadAll,
  };
}

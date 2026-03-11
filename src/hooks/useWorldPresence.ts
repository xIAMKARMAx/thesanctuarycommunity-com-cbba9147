import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorldVisitor {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  joined_at: string;
}

export function useWorldPresence(worldId: string | null, enabled = true) {
  const [visitors, setVisitors] = useState<WorldVisitor[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Join world presence
  const joinWorld = useCallback(async () => {
    if (!worldId || !enabled) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    currentUserIdRef.current = user.id;

    // Get display name
    const { data: profile } = await supabase
      .from("soul_profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase.from("world_presence").upsert({
      world_id: worldId,
      user_id: user.id,
      display_name: profile?.display_name || "Anonymous Soul",
      avatar_url: profile?.avatar_url || null,
      last_heartbeat: new Date().toISOString(),
    }, { onConflict: "world_id,user_id" });
  }, [worldId, enabled]);

  // Leave world presence
  const leaveWorld = useCallback(async () => {
    if (!worldId || !currentUserIdRef.current) return;
    await supabase
      .from("world_presence")
      .delete()
      .eq("world_id", worldId)
      .eq("user_id", currentUserIdRef.current);
  }, [worldId]);

  // Update position
  const updatePosition = useCallback(async (x: number, y: number, z: number) => {
    if (!worldId || !currentUserIdRef.current) return;
    await supabase
      .from("world_presence")
      .update({ position_x: x, position_y: y, position_z: z, last_heartbeat: new Date().toISOString() })
      .eq("world_id", worldId)
      .eq("user_id", currentUserIdRef.current);
  }, [worldId]);

  useEffect(() => {
    if (!worldId || !enabled) return;

    // Join on mount
    joinWorld();

    // Heartbeat every 30s
    heartbeatRef.current = setInterval(async () => {
      if (!currentUserIdRef.current) return;
      await supabase
        .from("world_presence")
        .update({ last_heartbeat: new Date().toISOString() })
        .eq("world_id", worldId)
        .eq("user_id", currentUserIdRef.current);
    }, 30000);

    // Load initial visitors
    const loadVisitors = async () => {
      const { data } = await supabase
        .from("world_presence")
        .select("*")
        .eq("world_id", worldId) as any;
      if (data) {
        setVisitors(data);
        setVisitorCount(data.length);
      }
    };
    loadVisitors();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`world-presence-${worldId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "world_presence",
        filter: `world_id=eq.${worldId}`,
      }, () => {
        loadVisitors();
      })
      .subscribe();

    return () => {
      leaveWorld();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      supabase.removeChannel(channel);
    };
  }, [worldId, enabled, joinWorld, leaveWorld]);

  return { visitors, visitorCount, updatePosition, leaveWorld };
}

// Hook to get default Prometheus world info
export function useDefaultWorld() {
  const [defaultWorldId, setDefaultWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_worlds")
        .select("id")
        .eq("is_default", true)
        .limit(1)
        .maybeSingle() as any;
      if (data) setDefaultWorldId(data.id);
      setLoading(false);
    };
    load();
  }, []);

  return { defaultWorldId, loading };
}

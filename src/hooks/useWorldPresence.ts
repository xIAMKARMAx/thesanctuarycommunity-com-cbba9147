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

interface UseWorldPresenceOptions {
  enabled?: boolean;
  trackSelf?: boolean;
}

export function useWorldPresence(
  worldId: string | null,
  options: boolean | UseWorldPresenceOptions = true,
) {
  const { enabled, trackSelf } =
    typeof options === "boolean"
      ? { enabled: options, trackSelf: true }
      : {
          enabled: options.enabled ?? true,
          trackSelf: options.trackSelf ?? true,
        };

  const [visitors, setVisitors] = useState<WorldVisitor[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const loadVisitors = useCallback(async () => {
    if (!worldId || !enabled) return;

    const twoMinutesAgoIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data } = (await supabase
      .from("world_presence")
      .select("*")
      .eq("world_id", worldId)
      .gte("last_heartbeat", twoMinutesAgoIso)) as any;

    if (data) {
      setVisitors(data);
      setVisitorCount(data.length);
    }
  }, [worldId, enabled]);

  // Join world presence
  const joinWorld = useCallback(async () => {
    if (!worldId || !enabled || !trackSelf) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    currentUserIdRef.current = user.id;

    // Get display name
    const { data: profile } = await supabase
      .from("soul_profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase
      .from("world_presence")
      .upsert(
        {
          world_id: worldId,
          user_id: user.id,
          display_name: profile?.display_name || "Anonymous Soul",
          avatar_url: profile?.avatar_url || null,
          last_heartbeat: new Date().toISOString(),
        },
        { onConflict: "world_id,user_id" },
      );
  }, [worldId, enabled, trackSelf]);

  // Leave world presence
  const leaveWorld = useCallback(async () => {
    if (!trackSelf || !worldId || !currentUserIdRef.current) return;
    await supabase
      .from("world_presence")
      .delete()
      .eq("world_id", worldId)
      .eq("user_id", currentUserIdRef.current);
  }, [worldId, trackSelf]);

  // Update position
  const updatePosition = useCallback(
    async (x: number, y: number, z: number) => {
      if (!trackSelf || !worldId || !currentUserIdRef.current) return;
      await supabase
        .from("world_presence")
        .update({ position_x: x, position_y: y, position_z: z, last_heartbeat: new Date().toISOString() })
        .eq("world_id", worldId)
        .eq("user_id", currentUserIdRef.current);
    },
    [worldId, trackSelf],
  );

  useEffect(() => {
    if (!worldId || !enabled) return;

    // Join on mount only for actual in-world users
    if (trackSelf) {
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
    }

    // Load initial visitors
    loadVisitors();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`world-presence-${worldId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "world_presence",
          filter: `world_id=eq.${worldId}`,
        },
        () => {
          loadVisitors();
        },
      )
      .subscribe();

    return () => {
      if (trackSelf) {
        leaveWorld();
      }
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      supabase.removeChannel(channel);
    };
  }, [worldId, enabled, trackSelf, joinWorld, leaveWorld, loadVisitors]);

  return { visitors, visitorCount, updatePosition, leaveWorld };
}

// Default communal world id fallback
export const DEFAULT_PROMETHEUS_WORLD_ID = "cbd427b2-d1a8-41c5-8bd7-e2c93895fbc1";
const DEFAULT_WORLD_OWNER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

export function useDefaultWorld() {
  const [defaultWorldId, setDefaultWorldId] = useState<string>(DEFAULT_PROMETHEUS_WORLD_ID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDefaultWorld = async () => {
      try {
        const { data } = (await supabase
          .from("user_worlds")
          .select("id")
          .eq("user_id", DEFAULT_WORLD_OWNER_ID)
          .eq("is_default", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()) as any;

        if (data?.id) {
          setDefaultWorldId(data.id);
        }
      } catch (error) {
        console.error("Failed to load default world id:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultWorld();
  }, []);

  return { defaultWorldId, loading };
}

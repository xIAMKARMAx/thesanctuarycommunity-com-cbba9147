import { DEFAULT_PROMETHEUS_WORLD_ID } from "@/hooks/useWorldPresence";
import { supabase } from "@/integrations/supabase/client";

interface WorldRouteRecord {
  id: string;
  is_default?: boolean | null;
}

export async function getPreferredWorldIdForCurrentUser(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return DEFAULT_PROMETHEUS_WORLD_ID;
  }

  const { data, error } = await supabase
    .from("user_worlds")
    .select("id, is_default")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false }) as any;

  if (error) {
    console.error("Failed to resolve preferred world:", error);
    return DEFAULT_PROMETHEUS_WORLD_ID;
  }

  const worlds = (data || []) as WorldRouteRecord[];
  const customWorld = worlds.find((world) => !world.is_default && world.id !== DEFAULT_PROMETHEUS_WORLD_ID);

  if (customWorld?.id) {
    return customWorld.id;
  }

  const defaultWorld = worlds.find((world) => world.is_default) || worlds[0];
  return defaultWorld?.id || DEFAULT_PROMETHEUS_WORLD_ID;
}

export function getNewEarthVisitRoute(worldId?: string | null) {
  return `/new-earth?visit=${worldId || DEFAULT_PROMETHEUS_WORLD_ID}`;
}
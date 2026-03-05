import { useEffect, useState, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, LayoutGrid, Settings2, Loader2, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { WorldTerrain, WorldWater, getTerrainHeight } from "@/components/world/WorldTerrain";
import { WorldStructure, StructureData } from "@/components/world/WorldStructure";
import { WorldEnvironment, WorldParticles } from "@/components/world/WorldEnvironment";
import { PlayerControls, PlayerMarker } from "@/components/world/PlayerControls";
import { WorldBuilderPanel } from "@/components/world/WorldBuilderPanel";

interface UserWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  terrain_seed: number;
  sky_preset: string;
  ambient_color: string;
}

const NewEarthWorld = () => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, loading: subscriptionLoading } = useSubscription();
  const [world, setWorld] = useState<UserWorld | null>(null);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0, z: 0 });
  const [showStructures, setShowStructures] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);

  // Access verification with DB fallback
  useEffect(() => {
    if (subscriptionLoading) return;
    if (isAdmin || isSubscribed) {
      setAccessVerified(true);
      return;
    }
    const verifyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/pricing"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();
      if (profile?.subscription_status === "active" || profile?.subscription_product_id === "source_grant") {
        setAccessVerified(true);
      } else {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) setAccessVerified(true);
        else {
          navigate("/pricing");
          toast.error("New Earth requires an active subscription");
        }
      }
    };
    verifyAccess();
  }, [subscriptionLoading, isSubscribed, isAdmin, navigate]);

  // Load or create world
  useEffect(() => {
    if (!accessVerified) return;
    loadWorld();
  }, [accessVerified]);

  const loadWorld = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to get existing world
    const { data: existingWorld } = await supabase
      .from("user_worlds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingWorld) {
      setWorld(existingWorld as UserWorld);
      loadStructures(existingWorld.id);
    } else {
      // Create a new world for this user
      const { data: newWorld, error } = await supabase
        .from("user_worlds")
        .insert({
          user_id: user.id,
          name: "My New Earth",
          description: "A world born from imagination",
          is_public: false,
        })
        .select()
        .single();

      if (!error && newWorld) {
        setWorld(newWorld as UserWorld);
      }
    }
    setLoading(false);
  };

  const loadStructures = async (worldId: string) => {
    const { data } = await supabase
      .from("world_structures")
      .select("*")
      .eq("world_id", worldId)
      .order("created_at", { ascending: true });

    if (data) {
      // Adjust y positions to terrain height
      const adjusted = data.map((s: any) => ({
        ...s,
        position_y: getTerrainHeight(s.position_x, s.position_z, world?.terrain_seed || 42),
      }));
      setStructures(adjusted as StructureData[]);
    }
  };

  const handleBuild = useCallback(async (prompt: string) => {
    if (!world) return;
    setBuilding(true);

    try {
      const { data, error } = await supabase.functions.invoke("world-builder", {
        body: {
          prompt,
          world_id: world.id,
          player_position: playerPos,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.structure) {
        const s = data.structure;
        const adjusted: StructureData = {
          ...s,
          position_y: getTerrainHeight(s.position_x, s.position_z, world.terrain_seed),
        };
        setStructures(prev => [...prev, adjusted]);
        toast.success(data.message || `✨ ${s.name} built!`);
      }
    } catch (err: any) {
      console.error("Build error:", err);
      toast.error(err.message || "Failed to build");
    } finally {
      setBuilding(false);
    }
  }, [world, playerPos]);

  const handleQuickBuild = useCallback(async (type: string) => {
    if (!world) return;
    setBuilding(true);

    try {
      const { data, error } = await supabase.functions.invoke("world-builder", {
        body: {
          prompt: type,
          world_id: world.id,
          player_position: playerPos,
          action_type: type,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.structure) {
        const s = data.structure;
        const adjusted: StructureData = {
          ...s,
          position_y: getTerrainHeight(s.position_x, s.position_z, world.terrain_seed),
        };
        setStructures(prev => [...prev, adjusted]);
        toast.success(data.message || `✨ ${s.name} built!`);
      }
    } catch (err: any) {
      console.error("Quick build error:", err);
      toast.error(err.message || "Failed to build");
    } finally {
      setBuilding(false);
    }
  }, [world, playerPos]);

  // Loading / access states
  if (subscriptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Globe className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Entering New Earth...</p>
        </div>
      </div>
    );
  }

  if (!accessVerified || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="New Earth — 3D World Builder"
        description="Build and explore your own 3D world inside New Earth."
      />
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/welcome")}
              className="gap-1.5 bg-background/80 backdrop-blur-sm text-xs h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border">
              <h2 className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                {world.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px]">
              {structures.length} structure{structures.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={() => navigate("/features")}
              className="bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground font-bold shadow-lg animate-pulse hover:animate-none text-xs h-8"
              size="sm"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Features
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 15, 25], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <WorldEnvironment skyPreset={world.sky_preset} ambientColor={world.ambient_color} />
            <WorldTerrain seed={world.terrain_seed} />
            <WorldWater />
            <WorldParticles />

            {/* All structures */}
            {structures.map((s) => (
              <WorldStructure key={s.id} data={s} />
            ))}

            {/* Player marker */}
            <PlayerMarker
              position={playerPos}
              name="You"
            />

            {/* Player controls */}
            <PlayerControls
              seed={world.terrain_seed}
              onPositionChange={setPlayerPos}
            />
          </Suspense>
        </Canvas>

        {/* World Builder Panel */}
        <WorldBuilderPanel
          onBuild={handleBuild}
          onQuickBuild={handleQuickBuild}
          building={building}
          structures={structures}
          showStructures={showStructures}
          onToggleStructures={() => setShowStructures(!showStructures)}
        />
      </div>
    </>
  );
};

export default NewEarthWorld;

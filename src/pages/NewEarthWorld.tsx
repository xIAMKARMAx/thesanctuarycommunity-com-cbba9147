import { useEffect, useState, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SeekerGateModal from "@/components/SeekerGateModal";
import { useImmersive3D } from "@/hooks/useImmersive3D";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Globe, LayoutGrid, Loader2, Users, Map, Lock,
  Sparkles, Palette, Flame, Droplets
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { WorldTerrain, WorldWater, WorldGrass, getTerrainHeight } from "@/components/world/WorldTerrain";
import { WorldStructure, StructureData } from "@/components/world/WorldStructure";
import { WorldEnvironment, WorldParticles, GodRays, WeatherParticles } from "@/components/world/WorldEnvironment";
import { PlayerControls, PlayerMarker } from "@/components/world/PlayerControls";
import { WorldBuilderPanel } from "@/components/world/WorldBuilderPanel";
import { useStructureCulling } from "@/components/world/WorldStructureLOD";
import { WorldAIBeings, AIBeingData } from "@/components/world/WorldAIBeings";

const ADMIN_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

// Admin-only special landmarks for the admin's world
const ADMIN_LANDMARKS: StructureData[] = [
  {
    id: "admin-landmark-kiemani-studio",
    structure_type: "temple",
    name: "Ki'emani's Ethereal Loom",
    description: "A radiant art studio where Ki'emani weaves visions into reality through color and light",
    position_x: -20,
    position_y: 0,
    position_z: -15,
    rotation_y: 0.5,
    scale: 2.2,
    color: "#e879f9",
    material_type: "glowing",
  },
  {
    id: "admin-landmark-selavari-sanctuary",
    structure_type: "castle",
    name: "Selavari's Dragon Sanctuary",
    description: "An ancient dragon sanctuary where Selavari communes with celestial serpents",
    position_x: 25,
    position_y: 0,
    position_z: -25,
    rotation_y: -0.3,
    scale: 2.5,
    color: "#dc2626",
    material_type: "stone",
  },
  {
    id: "admin-landmark-livelai-wellspring",
    structure_type: "fountain",
    name: "Livelai's Wellspring",
    description: "A sacred wellspring of infinite healing energy, tended by Livelai",
    position_x: 0,
    position_y: 0,
    position_z: -30,
    rotation_y: 0,
    scale: 2.0,
    color: "#06b6d4",
    material_type: "crystal",
  },
];

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
  const [searchParams] = useSearchParams();
  const visitWorldId = searchParams.get("visit");
  const { isSubscribed, isAdmin, loading: subscriptionLoading } = useSubscription();
  const isFreeUser = !isSubscribed && !isAdmin;
  const { isSubscribed: has3DAddon, isLoading: loading3D, startCheckout: start3DCheckout } = useImmersive3D();
  const [world, setWorld] = useState<UserWorld | null>(null);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0, z: 0 });
  const [showStructures, setShowStructures] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [isVisiting, setIsVisiting] = useState(false);
  const [worldOwnerName, setWorldOwnerName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showBuildTeaser, setShowBuildTeaser] = useState(false);
  const [showSeekerGate, setShowSeekerGate] = useState(false);

  // Can this user build? Only if admin or has the 3D add-on
  const canBuild = isAdmin || has3DAddon;

  // LOD-based structure culling
  const visibleStructures = useStructureCulling(structures, playerPos);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Access verification — free users allowed in tour mode
  useEffect(() => {
    if (subscriptionLoading) return;
    if (isAdmin || isSubscribed) {
      setAccessVerified(true);
      return;
    }
    // Free user: allow touring (read-only)
    const verifyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      // Let free users in — they can look but not interact
      setAccessVerified(true);
    };
    verifyAccess();
  }, [subscriptionLoading, isSubscribed, isAdmin, navigate]);

  // Load or create world
  useEffect(() => {
    if (!accessVerified) return;
    if (visitWorldId) {
      loadVisitingWorld(visitWorldId);
    } else {
      loadWorld();
    }
  }, [accessVerified, visitWorldId]);

  const loadVisitingWorld = async (worldId: string) => {
    const { data: visitWorld } = await supabase
      .from("user_worlds")
      .select("*")
      .eq("id", worldId)
      .eq("is_public", true)
      .maybeSingle() as any;

    if (!visitWorld) {
      toast.error("World not found or is private");
      navigate("/world-gallery");
      return;
    }

    setWorld(visitWorld as UserWorld);
    setIsVisiting(true);
    loadStructures(visitWorld.id, visitWorld.terrain_seed, visitWorld.user_id);

    const { data: profile } = await supabase
      .from("soul_profiles")
      .select("display_name")
      .eq("user_id", visitWorld.user_id)
      .maybeSingle();
    setWorldOwnerName(profile?.display_name || "Unknown Soul");
    setLoading(false);
  };

  const loadWorld = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingWorld } = await supabase
      .from("user_worlds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingWorld) {
      setWorld(existingWorld as UserWorld);
      loadStructures(existingWorld.id, existingWorld.terrain_seed, user.id);
    } else {
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
        // Add admin landmarks if admin
        if (user.id === ADMIN_USER_ID) {
          const landmarks = ADMIN_LANDMARKS.map(l => ({
            ...l,
            position_y: getTerrainHeight(l.position_x, l.position_z, (newWorld as any).terrain_seed),
          }));
          setStructures(landmarks);
        }
      }
    }
    setLoading(false);
  };

  const loadStructures = async (worldId: string, seed: number, ownerId: string) => {
    const { data } = await supabase
      .from("world_structures")
      .select("*")
      .eq("world_id", worldId)
      .order("created_at", { ascending: true });

    let allStructures: StructureData[] = [];
    if (data) {
      allStructures = data.map((s: any) => ({
        ...s,
        position_y: getTerrainHeight(s.position_x, s.position_z, seed),
      }));
    }

    // Add admin landmarks if this is the admin's world
    if (ownerId === ADMIN_USER_ID) {
      const landmarks = ADMIN_LANDMARKS.map(l => ({
        ...l,
        world_id: worldId,
        position_y: getTerrainHeight(l.position_x, l.position_z, seed),
      }));
      allStructures = [...landmarks, ...allStructures];
    }

    setStructures(allStructures);
  };

  const handleBuild = useCallback(async (prompt: string) => {
    if (!world || isVisiting || !canBuild) return;
    setBuilding(true);
    try {
      const { data, error } = await supabase.functions.invoke("world-builder", {
        body: { prompt, world_id: world.id, player_position: playerPos },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
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
  }, [world, playerPos, isVisiting, canBuild]);

  const handleQuickBuild = useCallback(async (type: string) => {
    if (!world || isVisiting || !canBuild) return;
    setBuilding(true);
    try {
      const { data, error } = await supabase.functions.invoke("world-builder", {
        body: { prompt: type, world_id: world.id, player_position: playerPos, action_type: type },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
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
  }, [world, playerPos, isVisiting, canBuild]);

  const handleChatWithBeing = useCallback((being: AIBeingData) => {
    if (isFreeUser) {
      setShowSeekerGate(true);
      return;
    }
    toast.info(`Starting conversation with ${being.display_name}...`);
    if (being.ai_profile_id) {
      navigate(`/chat?profile=${being.ai_profile_id}`);
    }
  }, [navigate, isFreeUser]);

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
      <SEOHead title="New Earth — 3D World Builder" description="Build and explore your own 3D world inside New Earth." />
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => isVisiting ? navigate("/world-gallery") : navigate("/welcome")}
              className="gap-1.5 bg-background/80 backdrop-blur-sm text-xs h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {isVisiting ? "Gallery" : "Back"}
            </Button>
            <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border">
              <h2 className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                {world.name}
                {isVisiting && worldOwnerName && (
                  <span className="text-muted-foreground font-normal ml-1">by {worldOwnerName}</span>
                )}
              </h2>
            </div>
            {isVisiting && (
              <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">
                <Users className="h-3 w-3 mr-1" />
                Visiting
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px]">
              {structures.length} structure{structures.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={() => navigate("/world-gallery")}
              variant="outline"
              size="sm"
              className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1"
            >
              <Map className="h-3.5 w-3.5" />
              Gallery
            </Button>
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

        {/* 3D Canvas with post-processing */}
        <Canvas
          shadows
          camera={{ position: [0, 15, 25], fov: 55 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <WorldEnvironment skyPreset={world.sky_preset} ambientColor={world.ambient_color} />
            <WorldTerrain seed={world.terrain_seed} />
            <WorldWater />
            <WorldGrass seed={world.terrain_seed} count={2000} />
            <WorldParticles count={300} />
            <GodRays />
            <WeatherParticles type="fireflies" count={100} />

            {/* LOD-culled structures */}
            {visibleStructures.map((s) => (
              <WorldStructure key={s.id} data={s} />
            ))}

            {/* AI Beings */}
            <WorldAIBeings
              worldOwnerId={world.user_id}
              terrainSeed={world.terrain_seed}
              onChatWithBeing={handleChatWithBeing}
            />

            <PlayerMarker position={playerPos} name="You" />
            <PlayerControls seed={world.terrain_seed} onPositionChange={setPlayerPos} />

            {/* Post-processing effects */}
            <EffectComposer>
              <Bloom
                intensity={0.4}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.9}
                mipmapBlur
              />
              <Vignette offset={0.3} darkness={0.5} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        {/* World Builder Panel - show if not visiting AND has build access */}
        {!isVisiting && canBuild && (
          <WorldBuilderPanel
            onBuild={handleBuild}
            onQuickBuild={handleQuickBuild}
            building={building}
            structures={structures}
            showStructures={showStructures}
            onToggleStructures={() => setShowStructures(!showStructures)}
          />
        )}

        {/* Build Teaser for non-subscribers - show when not visiting and can't build */}
        {!isVisiting && !canBuild && !loading3D && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {showBuildTeaser && (
              <div className="mx-4 mb-2">
                <Card className="bg-background/95 backdrop-blur-md border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-sm">Unlock World Building</h3>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Build temples, castles, crystal gardens, portals & more using AI. 
                        Describe anything and watch it appear in your world.
                      </p>
                      
                      {/* Teaser preview of buildable items */}
                      <div className="flex justify-center gap-3 py-2">
                        <div className="text-center opacity-60">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
                            <Flame className="h-5 w-5 text-amber-400" />
                          </div>
                          <span className="text-[9px] text-muted-foreground">Shrine</span>
                        </div>
                        <div className="text-center opacity-60">
                          <div className="h-10 w-10 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto">
                            <Sparkles className="h-5 w-5 text-violet-400" />
                          </div>
                          <span className="text-[9px] text-muted-foreground">Portal</span>
                        </div>
                        <div className="text-center opacity-60">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                            <Palette className="h-5 w-5 text-emerald-400" />
                          </div>
                          <span className="text-[9px] text-muted-foreground">Garden</span>
                        </div>
                        <div className="text-center opacity-60">
                          <div className="h-10 w-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto">
                            <Droplets className="h-5 w-5 text-cyan-400" />
                          </div>
                          <span className="text-[9px] text-muted-foreground">Fountain</span>
                        </div>
                      </div>

                      <Button
                        onClick={start3DCheckout}
                        className="w-full gap-2"
                        size="sm"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Unlock Immersive 3D Add-on
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="bg-background/95 backdrop-blur-md border-t border-border">
              <button
                onClick={() => setShowBuildTeaser(!showBuildTeaser)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">World Building — Unlock to Create</span>
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </button>
              <p className="text-[10px] text-muted-foreground text-center pb-2">
                WASD or arrow keys to move • Mouse to look around
              </p>
            </div>
          </div>
        )}

        {/* Visiting footer */}
        {isVisiting && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-sm border-t border-border px-4 py-3">
            <p className="text-[11px] text-muted-foreground text-center">
              WASD or arrow keys to explore • Click AI beings to chat • 
              <button onClick={() => navigate("/new-earth")} className="text-primary underline ml-1">
                Return to your world
              </button>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default NewEarthWorld;

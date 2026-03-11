import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
// EffectComposer removed — was crashing due to postprocessing lib incompatibility
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SeekerGateModal from "@/components/SeekerGateModal";
import { useImmersive3D } from "@/hooks/useImmersive3D";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Globe, LayoutGrid, Loader2, Users, Map, Lock,
  Sparkles, Palette, Flame, Droplets, Crown
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
  is_default?: boolean;
  terrain_seed: number;
  sky_preset: string;
  ambient_color: string;
}

// Check WebGL support
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Error boundary specifically for the 3D canvas
interface CanvasErrorState { hasError: boolean; error?: string }
class Canvas3DErrorBoundary extends React.Component<React.PropsWithChildren, CanvasErrorState> {
  state: CanvasErrorState = { hasError: false };
  static getDerivedStateFromError(error: Error): CanvasErrorState {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error) {
    console.error("3D Canvas crashed:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-sm px-6">
            <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">3D World Unavailable</h2>
            <p className="text-sm text-muted-foreground">
              The 3D renderer encountered an issue. This can happen on devices with limited graphics support.
            </p>
            <p className="text-xs text-muted-foreground/70">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const NewEarthWorld = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitWorldId = searchParams.get("visit");
  const { isSubscribed, isAdmin, loading: subscriptionLoading, productId } = useSubscription();
  const isNewEarthTier = productId === 'prod_U5jdDVZhQFGQWv' || productId === 'source_grant';
  const isArchitectTier = productId === 'prod_Tt8qVh88c2WQld';
  const isFreeUser = !isSubscribed && !isAdmin;
  const hasWorldAccess = isAdmin || isNewEarthTier || isArchitectTier;
  // In the default Prometheus world, ONLY admin can build. In personal worlds, New Earth tier can build.
  const [isDefaultWorld, setIsDefaultWorld] = useState(false);
  const canBuild = isDefaultWorld ? isAdmin : (isAdmin || isNewEarthTier);
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

  // LOD-based structure culling
  const visibleStructures = useStructureCulling(structures, playerPos);

  // Catch unhandled promise rejections to prevent white screen
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection in New Earth:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // WebGL support check
  const [webglSupported] = useState(() => isWebGLAvailable());

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    }).catch(err => console.error("Auth error:", err));
  }, []);

  // Access verification — Architect/New Earth/admin can enter own worlds.
  // ALL subscribers can enter the default Prometheus world. Free users get tour mode for default world.
  useEffect(() => {
    if (subscriptionLoading) return;
    
    // Check if visiting the default Prometheus world
    const checkDefaultWorld = async () => {
      if (visitWorldId) {
        const { data } = await supabase
          .from("user_worlds")
          .select("is_default")
          .eq("id", visitWorldId)
          .maybeSingle() as any;
        if (data?.is_default) {
          setIsDefaultWorld(true);
          // ALL authenticated users can enter the default world
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { navigate("/auth"); return; }
          setAccessVerified(true);
          return true;
        }
      }
      return false;
    };
    
    checkDefaultWorld().then((isDefault) => {
      if (isDefault) return;
      
      if (isAdmin || hasWorldAccess) {
        setAccessVerified(true);
        return;
      }
      // Allow visiting public worlds for anyone logged in (tour mode)
      if (visitWorldId) {
        const verifyAuth = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { navigate("/auth"); return; }
          setAccessVerified(true);
        };
        verifyAuth().catch(() => setAccessVerified(true));
        return;
      }
      // Non-qualifying tiers: redirect to pricing
      if (isSubscribed && !hasWorldAccess) {
        toast.error("New Earth requires the Architect ($29.99/mo) or New Earth ($49.99/mo) tier");
        navigate("/pricing");
        return;
      }
      // Free users: show seeker gate
      const verifyAccess = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { navigate("/auth"); return; }
          setAccessVerified(true);
        } catch (err) {
          console.error("Access verification error:", err);
          setAccessVerified(true);
        }
      };
      verifyAccess();
    });
  }, [subscriptionLoading, isSubscribed, isAdmin, hasWorldAccess, navigate, visitWorldId]);

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
    try {
      // First check if it's the default world (accessible to all)
      const { data: defaultCheck } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("id", worldId)
        .maybeSingle() as any;

      if (!defaultCheck) {
        toast.error("World not found");
        navigate("/world-gallery");
        return;
      }

      // Allow access if it's the default world OR if it's public
      if (!defaultCheck.is_default && !defaultCheck.is_public) {
        toast.error("World not found or is private");
        navigate("/world-gallery");
        return;
      }

      if (defaultCheck.is_default) setIsDefaultWorld(true);

      setWorld(defaultCheck as UserWorld);
      setIsVisiting(true);
      await loadStructures(defaultCheck.id, defaultCheck.terrain_seed, defaultCheck.user_id);

      const { data: profile } = await supabase
        .from("soul_profiles")
        .select("display_name")
        .eq("user_id", defaultCheck.user_id)
        .maybeSingle();
      setWorldOwnerName(profile?.display_name || "Unknown Soul");
    } catch (err) {
      console.error("Error loading visiting world:", err);
      toast.error("Failed to load world");
    } finally {
      setLoading(false);
    }
  };

  const loadWorld = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: existingWorld } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingWorld) {
        setWorld(existingWorld as UserWorld);
        await loadStructures(existingWorld.id, existingWorld.terrain_seed, user.id);
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
          if (user.id === ADMIN_USER_ID) {
            const landmarks = ADMIN_LANDMARKS.map(l => ({
              ...l,
              position_y: getTerrainHeight(l.position_x, l.position_z, (newWorld as any).terrain_seed),
            }));
            setStructures(landmarks);
          }
        }
      }
    } catch (err) {
      console.error("Error loading world:", err);
      toast.error("Failed to load your world. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const handleExitWorld = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/community");
  }, [navigate]);

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

  if (!webglSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-6">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">3D Not Supported</h2>
          <p className="text-sm text-muted-foreground">
            Your browser or device doesn't support WebGL, which is needed for the 3D world. Try using a different browser or device.
          </p>
          <Button onClick={() => navigate("/welcome")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
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
              onClick={handleExitWorld}
              className="gap-1.5 bg-background/80 backdrop-blur-sm text-xs h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {isVisiting ? "Exit World" : "Back"}
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
            <Button
              onClick={() => navigate("/dedication")}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 hover:border-amber-500/60 backdrop-blur-sm text-xs h-8 gap-1 text-amber-300 hover:text-amber-200"
            >
              <Crown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">NEW EARTH</span> VIPs
            </Button>
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
        <Canvas3DErrorBoundary>
          <Canvas
            shadows
            camera={{ position: [0, 15, 25], fov: 55 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
              failIfMajorPerformanceCaveat: false,
            }}
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;

              const handleContextLost = (event: Event) => {
                event.preventDefault();
                console.error("WebGL context lost");

                const reloadCount = parseInt(sessionStorage.getItem("webgl_reload_count") || "0", 10);
                if (reloadCount < 2) {
                  sessionStorage.setItem("webgl_reload_count", String(reloadCount + 1));
                  toast.error("Graphics context lost. Reloading...");
                  setTimeout(() => window.location.reload(), 1500);
                  return;
                }

                toast.error("3D rendering failed. Please refresh manually or try a different browser/device.");
              };

              const handleContextRestored = () => {
                sessionStorage.removeItem("webgl_reload_count");
              };

              canvas.addEventListener("webglcontextlost", handleContextLost, { passive: false });
              canvas.addEventListener("webglcontextrestored", handleContextRestored);

              // Reset reload guard only after the canvas remains stable for a while.
              window.setTimeout(() => {
                const count = parseInt(sessionStorage.getItem("webgl_reload_count") || "0", 10);
                if (count > 0) {
                  sessionStorage.removeItem("webgl_reload_count");
                }
              }, 15000);
            }}
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

              {/* Post-processing removed for stability */}
            </Suspense>
          </Canvas>
        </Canvas3DErrorBoundary>

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

        {/* Free user tour footer */}
        {!isVisiting && isFreeUser && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t border-border">
            <button
              onClick={() => setShowSeekerGate(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">You&apos;re touring New Earth — Subscribe to unlock all features</span>
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </button>
            <p className="text-[10px] text-muted-foreground text-center pb-2">
              WASD or arrow keys to look around
            </p>
          </div>
        )}

        {/* Build Teaser for Architect users who can't build (need New Earth tier) */}
        {!isVisiting && !isFreeUser && !canBuild && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {showBuildTeaser && (
              <div className="mx-4 mb-2">
                <Card className="bg-background/95 backdrop-blur-md border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-sm">Building Requires New Earth</h3>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        In order to use these features &amp; build more worlds of your own, upgrade to the $49.99 subscription.
                      </p>
                      <Button
                        onClick={() => navigate("/pricing")}
                        className="w-full gap-2"
                        size="sm"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        Upgrade to New Earth — $49.99/mo
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
                <span className="text-xs font-medium">Upgrade to $49.99 to build worlds &amp; unlock all features</span>
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </button>
              <p className="text-[10px] text-muted-foreground text-center pb-2">
                WASD or arrow keys to move • Mouse to look around • Chat with your beings here
              </p>
            </div>
          </div>
        )}

        {/* Visiting footer */}
        {isVisiting && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-sm border-t border-border px-4 py-3">
            <p className="text-[11px] text-muted-foreground text-center">
              WASD or arrow keys to explore • Click AI beings to chat • 
              <button onClick={handleExitWorld} className="text-primary underline ml-1">
                Exit world
              </button>
            </p>
          </div>
        )}

        {/* Seeker gate modal for free users */}
        <SeekerGateModal open={showSeekerGate} onClose={() => setShowSeekerGate(false)} />
      </div>
    </>
  );
};

export default NewEarthWorld;

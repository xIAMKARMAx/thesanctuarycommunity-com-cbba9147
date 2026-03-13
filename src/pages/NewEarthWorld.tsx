import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
// EffectComposer removed — was crashing due to postprocessing lib incompatibility
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SeekerGateModal from "@/components/SeekerGateModal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Globe, LayoutGrid, Loader2, Users, Map, Lock,
  Sparkles, Flame, Crown, MessageCircle
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
import { DEFAULT_PROMETHEUS_WORLD_ID, useWorldPresence } from "@/hooks/useWorldPresence";


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
  thumbnail_url: string | null;
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
  const resolvedWorldId = visitWorldId || DEFAULT_PROMETHEUS_WORLD_ID;
  const { isSubscribed, isAdmin, loading: subscriptionLoading, productId } = useSubscription();
  const isNewEarthTier = productId === 'prod_U5jdDVZhQFGQWv' || productId === 'source_grant';
  const isFreeUser = !isSubscribed && !isAdmin;
  // In the default Prometheus world, ONLY admin can build. In personal worlds, New Earth tier can build.
  const [isDefaultWorld, setIsDefaultWorld] = useState(false);
  const canBuild = isDefaultWorld ? isAdmin : (isAdmin || isNewEarthTier);
  const [world, setWorld] = useState<UserWorld | null>(null);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0, z: 0 });
  const [showStructures, setShowStructures] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [isVisiting, setIsVisiting] = useState(false);
  const [worldOwnerName, setWorldOwnerName] = useState<string | null>(null);
  const [showBuildTeaser, setShowBuildTeaser] = useState(false);
  const [showSeekerGate, setShowSeekerGate] = useState(false);

  // LOD-based structure culling
  const visibleStructures = useStructureCulling(structures, playerPos);

  // Presence is tracked only from inside the world (not from community previews)
  const { visitorCount, updatePosition } = useWorldPresence(world?.id ?? null, {
    enabled: Boolean(world?.id && accessVerified),
    trackSelf: true,
  });

  // Catch unhandled promise rejections to prevent white screen
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("[NewEarth] Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // WebGL support check
  const [webglSupported] = useState(() => isWebGLAvailable());

  // Keep visitor position synced with lightweight debounce
  useEffect(() => {
    if (!world || !accessVerified) return;
    const timer = window.setTimeout(() => {
      void updatePosition(playerPos.x, playerPos.y, playerPos.z);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [playerPos, world, accessVerified, updatePosition]);

  // Access verification for open-world visiting
  useEffect(() => {
    if (subscriptionLoading) return;

    const verifyAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: targetWorld } = await supabase
          .from("user_worlds")
          .select("id, is_default, is_public, user_id")
          .eq("id", resolvedWorldId)
          .maybeSingle() as any;

        if (!targetWorld) {
          toast.error("Prometheus world is unavailable right now.");
          navigate("/community");
          return;
        }

        // For explicitly requested worlds, enforce visibility unless owner/admin
        if (
          visitWorldId &&
          !targetWorld.is_default &&
          !targetWorld.is_public &&
          targetWorld.user_id !== user.id &&
          !isAdmin
        ) {
          toast.error("World not found or is private");
          navigate("/world-gallery");
          return;
        }

        setIsDefaultWorld(Boolean(targetWorld.is_default));
        setAccessVerified(true);
      } catch (err) {
        console.error("Access verification error:", err);
        toast.error("Unable to verify world access");
        navigate("/community");
      }
    };

    verifyAccess();
  }, [subscriptionLoading, navigate, visitWorldId, resolvedWorldId, isAdmin]);

  // Always load the resolved world (Prometheus by default)
  useEffect(() => {
    if (!accessVerified) return;
    loadVisitingWorld(resolvedWorldId);
  }, [accessVerified, resolvedWorldId]);

  const loadVisitingWorld = async (worldId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Load exact world configuration by id
      const { data: targetWorld } = (await supabase
        .from("user_worlds")
        .select("*")
        .eq("id", worldId)
        .maybeSingle()) as any;

      if (!targetWorld) {
        toast.error("World not found");
        navigate("/world-gallery");
        return;
      }

      const isOwner = user?.id === targetWorld.user_id;

      // Allow access if default/public, owner, or admin
      if (!targetWorld.is_default && !targetWorld.is_public && !isOwner && !isAdmin) {
        toast.error("World not found or is private");
        navigate("/world-gallery");
        return;
      }

      setIsDefaultWorld(Boolean(targetWorld.is_default));
      setWorld(targetWorld as UserWorld);
      setIsVisiting(!isOwner && !isAdmin);
      await loadStructures(targetWorld.id, targetWorld.terrain_seed);

      const { data: profile } = await supabase
        .from("soul_profiles")
        .select("display_name")
        .eq("user_id", targetWorld.user_id)
        .maybeSingle();
      setWorldOwnerName(profile?.display_name || "Unknown Soul");
    } catch (err) {
      console.error("Error loading visiting world:", err);
      toast.error("Failed to load world");
    } finally {
      setLoading(false);
    }
  };

  const loadStructures = async (worldId: string, seed: number) => {
    const { data } = await supabase
      .from("world_structures")
      .select("*")
      .eq("world_id", worldId)
      .order("created_at", { ascending: true });

    const allStructures: StructureData[] =
      data?.map((s: any) => ({
        ...s,
        position_y: getTerrainHeight(s.position_x, s.position_z, seed),
      })) || [];

    setStructures(allStructures);
  };

  const handleBuildSpec = useCallback(async (spec: import("@/components/world/WorldBuildDialog").BuildSpec) => {
    if (!world || isVisiting || !canBuild) return;
    setBuilding(true);
    try {
      // Position near player with slight offset
      const px = playerPos?.x || 0;
      const pz = playerPos?.z || 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 8;
      const posX = px + Math.cos(angle) * dist;
      const posZ = pz + Math.sin(angle) * dist;

      const { data: structure, error: insertError } = await supabase
        .from("world_structures")
        .insert({
          world_id: world.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          structure_type: spec.structure_type,
          name: spec.name,
          description: spec.description,
          position_x: posX,
          position_y: 0,
          position_z: posZ,
          rotation_y: Math.random() * Math.PI * 2,
          scale: Math.min(3, Math.max(0.5, spec.scale)),
          color: spec.color,
          material_type: spec.material_type,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (structure) {
        const adjusted: StructureData = {
          ...structure,
          position_y: getTerrainHeight(structure.position_x, structure.position_z, world.terrain_seed),
        };
        setStructures(prev => [...prev, adjusted]);
        toast.success(`✨ ${spec.name} has been manifested!`);
      }
    } catch (err: any) {
      console.error("Build error:", err);
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
      <div className="h-screen w-screen relative overflow-hidden bg-background">
        {/* Garden of Light fixed background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/realm-assets/realm-garden-of-light.jpg"
            alt="Garden of Light"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>

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
                {visitorCount} Live
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {isVisiting ? (
              <>
                <Button
                  onClick={() => navigate("/chat")}
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </Button>
                <Button
                  onClick={() => navigate("/attunement")}
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Meditate
                </Button>
                <Button
                  onClick={() => navigate("/community")}
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1"
                >
                  <Flame className="h-3.5 w-3.5" />
                  Rituals
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* 3D Canvas with post-processing */}
        <Canvas3DErrorBoundary>
          <Canvas
            shadows
            camera={{ position: [0, 15, 25], fov: 55 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
              failIfMajorPerformanceCaveat: false,
            }}
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            style={{ background: "transparent" }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;

              const handleContextLost = (event: Event) => {
                event.preventDefault();
                console.error("WebGL context lost");
                toast.error("Graphics context lost. Leaving world to prevent reload loop.");
                navigate("/community", { replace: true });
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
              {/* Lighting only — no sky/terrain/water since Garden of Light is the background */}
              <ambientLight intensity={0.5} color="#ffe8d0" />
              <directionalLight position={[50, 40, 30]} intensity={1.0} color="#fff5e0" />
              <hemisphereLight args={["#87ceeb", "#3a5a2a", 0.3]} />
              <pointLight position={[0, 15, 0]} color={world.ambient_color} intensity={0.4} distance={60} />
              
              <WorldParticles count={300} />
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
            onBuildSpec={handleBuildSpec}
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

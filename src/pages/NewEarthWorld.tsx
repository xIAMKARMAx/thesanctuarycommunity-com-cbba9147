import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SeekerGateModal from "@/components/SeekerGateModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Globe, Loader2, Users, Map, Lock,
  Sparkles, Flame, Crown, MessageCircle, LayoutGrid
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { WorldBuilderPanel } from "@/components/world/WorldBuilderPanel";
import { DEFAULT_PROMETHEUS_WORLD_ID, useWorldPresence } from "@/hooks/useWorldPresence";
import type { BuildSpec } from "@/components/world/WorldBuildDialog";

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

interface StructureRecord {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

const NewEarthWorld = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitWorldId = searchParams.get("visit");
  const resolvedWorldId = visitWorldId || DEFAULT_PROMETHEUS_WORLD_ID;
  const { isSubscribed, isAdmin, loading: subscriptionLoading, productId } = useSubscription();
  const isNewEarthTier = productId === 'prod_U5jdDVZhQFGQWv' || productId === 'source_grant';
  const isFreeUser = !isSubscribed && !isAdmin;
  const [isDefaultWorld, setIsDefaultWorld] = useState(false);
  const canBuild = isDefaultWorld ? isAdmin : (isAdmin || isNewEarthTier);
  const [world, setWorld] = useState<UserWorld | null>(null);
  const [structures, setStructures] = useState<StructureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [showStructures, setShowStructures] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [isVisiting, setIsVisiting] = useState(false);
  const [worldOwnerName, setWorldOwnerName] = useState<string | null>(null);
  const [showBuildTeaser, setShowBuildTeaser] = useState(false);
  const [showSeekerGate, setShowSeekerGate] = useState(false);
  // The current world scene image — starts with Garden of Light, updates when user builds
  const [worldSceneUrl, setWorldSceneUrl] = useState<string>("/realm-assets/realm-garden-of-light.jpg");

  const { visitorCount } = useWorldPresence(world?.id ?? null, {
    enabled: Boolean(world?.id && accessVerified),
    trackSelf: true,
  });

  // Access verification
  useEffect(() => {
    if (subscriptionLoading) return;

    const verifyAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/auth"); return; }

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

        if (visitWorldId && !targetWorld.is_default && !targetWorld.is_public && targetWorld.user_id !== user.id && !isAdmin) {
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

  // Load world
  useEffect(() => {
    if (!accessVerified) return;
    loadWorld(resolvedWorldId);
  }, [accessVerified, resolvedWorldId]);

  const loadWorld = async (worldId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: targetWorld } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("id", worldId)
        .maybeSingle() as any;

      if (!targetWorld) {
        toast.error("World not found");
        navigate("/world-gallery");
        return;
      }

      const isOwner = user?.id === targetWorld.user_id;
      if (!targetWorld.is_default && !targetWorld.is_public && !isOwner && !isAdmin) {
        toast.error("World not found or is private");
        navigate("/world-gallery");
        return;
      }

      setIsDefaultWorld(Boolean(targetWorld.is_default));
      setWorld(targetWorld as UserWorld);
      setIsVisiting(!isOwner && !isAdmin);

      // If world has a thumbnail (generated scene), use it; otherwise Garden of Light
      if (targetWorld.thumbnail_url) {
        setWorldSceneUrl(targetWorld.thumbnail_url);
      }

      // Load structures list
      const { data: structs } = await supabase
        .from("world_structures")
        .select("id, name, description, image_url")
        .eq("world_id", worldId)
        .order("created_at", { ascending: false });

      setStructures(structs?.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        image_url: s.image_url,
      })) || []);

      // If the most recent structure has an image, show that as the world scene
      if (structs && structs.length > 0 && (structs[0] as any).image_url) {
        setWorldSceneUrl((structs[0] as any).image_url);
      }

      const { data: profile } = await supabase
        .from("soul_profiles")
        .select("display_name")
        .eq("user_id", targetWorld.user_id)
        .maybeSingle();
      setWorldOwnerName(profile?.display_name || "Unknown Soul");
    } catch (err) {
      console.error("Error loading world:", err);
      toast.error("Failed to load world");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildSpec = useCallback(async (spec: BuildSpec) => {
    if (!world || isVisiting || !canBuild) return;
    setBuilding(true);
    try {
      const { data, error } = await supabase.functions.invoke("world-builder", {
        body: {
          world_id: world.id,
          name: spec.name,
          description: spec.description,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.image_url) {
        setWorldSceneUrl(data.image_url);
      }

      if (data?.structure) {
        setStructures(prev => [{
          id: data.structure.id,
          name: data.structure.name,
          description: data.structure.description,
          image_url: data.structure.image_url,
        }, ...prev]);
      }

      toast.success(data?.message || `✨ ${spec.name} has been manifested!`);
    } catch (err: any) {
      console.error("Build error:", err);
      toast.error(err.message || "Failed to build — please try again");
    } finally {
      setBuilding(false);
    }
  }, [world, isVisiting, canBuild]);

  const handleExitWorld = useCallback(() => {
    if (window.history.length > 1) { navigate(-1); return; }
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

  if (!accessVerified || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="New Earth — World Builder" description="Build and explore your world inside New Earth." />
      <div className="h-screen w-screen relative overflow-hidden bg-background">
        {/* World scene background — Garden of Light or latest generated scene */}
        <div className="absolute inset-0 z-0">
          <img
            src={worldSceneUrl}
            alt="New Earth World"
            className="h-full w-full object-cover transition-all duration-1000"
            loading="eager"
          />
          {/* Subtle gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
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
                <Button onClick={() => navigate("/chat")} variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> Message
                </Button>
                <Button onClick={() => navigate("/attunement")} variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Meditate
                </Button>
                <Button onClick={() => navigate("/community")} variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1">
                  <Flame className="h-3.5 w-3.5" /> Rituals
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate("/chat")} variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> Messages
                </Button>
                <Button onClick={() => navigate("/attunement")} variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Meditate
                </Button>
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
                  {structures.length} creation{structures.length !== 1 ? "s" : ""}
                </Badge>
                <Button onClick={() => navigate("/world-gallery")} variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm text-xs h-8 gap-1">
                  <Map className="h-3.5 w-3.5" /> Gallery
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

        {/* World Builder Panel — for users who can build */}
        {!isVisiting && canBuild && (
          <WorldBuilderPanel
            onBuildSpec={handleBuildSpec}
            building={building}
            structures={structures}
            showStructures={showStructures}
            onToggleStructures={() => setShowStructures(!showStructures)}
          />
        )}

        {/* Free user footer */}
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
          </div>
        )}

        {/* Build Teaser for non-New-Earth subscribers */}
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
                        Upgrade to the $49.99 subscription to build worlds and generate AI environments.
                      </p>
                      <Button onClick={() => navigate("/pricing")} className="w-full gap-2" size="sm">
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
                <span className="text-xs font-medium">Upgrade to $49.99 to build worlds & unlock all features</span>
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </button>
            </div>
          </div>
        )}

        {/* Visiting footer */}
        {isVisiting && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-sm border-t border-border px-4 py-3">
            <p className="text-[11px] text-muted-foreground text-center">
              Exploring {worldOwnerName}'s world •{" "}
              <button onClick={handleExitWorld} className="text-primary underline ml-1">
                Exit world
              </button>
            </p>
          </div>
        )}

        {/* Seeker gate modal */}
        <SeekerGateModal open={showSeekerGate} onClose={() => setShowSeekerGate(false)} />
      </div>
    </>
  );
};

export default NewEarthWorld;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { DEFAULT_PROMETHEUS_WORLD_ID } from "@/hooks/useWorldPresence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, Globe, Users, Eye, Lock, Unlock, Loader2, Search,
  Plus, Crown, Sparkles, MapPin, Heart, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

interface WorldRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  is_default?: boolean;
  terrain_seed: number;
  sky_preset: string;
  visitor_count: number;
  thumbnail_url: string | null;
  created_at: string;
  owner_name?: string;
}

const SKY_COLORS: Record<string, string> = {
  dawn: "from-orange-400/20 to-pink-300/20",
  day: "from-blue-400/20 to-cyan-200/20",
  sunset: "from-orange-500/20 to-purple-400/20",
  twilight: "from-indigo-500/20 to-purple-600/20",
  night: "from-slate-800/20 to-indigo-900/20",
  mystical: "from-violet-500/20 to-fuchsia-400/20",
  ethereal: "from-teal-300/20 to-violet-300/20",
};

const WorldGallery = () => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, loading: subLoading, productId } = useSubscription();
  const isNewEarthTier = productId === "prod_U5jdDVZhQFGQWv" || productId === "source_grant";

  const [prometheusWorld, setPrometheusWorld] = useState<WorldRecord | null>(null);
  const [myWorlds, setMyWorlds] = useState<WorldRecord[]>([]);
  const [publicWorlds, setPublicWorlds] = useState<WorldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingPublic, setTogglingPublic] = useState<string | null>(null);

  // Build dialog
  const [buildOpen, setBuildOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingWorld, setDeletingWorld] = useState<string | null>(null);

  const handleDeleteWorld = async (worldId: string, worldName: string) => {
    if (!confirm(`Are you sure you want to delete "${worldName}"? This cannot be undone.`)) return;
    setDeletingWorld(worldId);
    try {
      const { error } = await supabase
        .from("user_worlds")
        .delete()
        .eq("id", worldId);
      if (error) throw error;
      setMyWorlds(prev => prev.filter(w => w.id !== worldId));
      toast.success(`"${worldName}" has been dissolved from existence`);
    } catch (err: any) {
      console.error("Delete world error:", err);
      toast.error(err.message || "Failed to delete world");
    } finally {
      setDeletingWorld(null);
    }
  };

  useEffect(() => {
    if (subLoading) return;
    if (!isSubscribed && !isAdmin) {
      navigate("/pricing");
      return;
    }
    loadWorlds();
  }, [subLoading, isSubscribed, isAdmin]);

  const loadWorlds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: defaultWorld } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("id", DEFAULT_PROMETHEUS_WORLD_ID)
        .maybeSingle() as any;

      if (defaultWorld) setPrometheusWorld(defaultWorld as WorldRecord);

      const { data: mine } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any;

      const myList = (mine || []).filter((w: any) => w.id !== DEFAULT_PROMETHEUS_WORLD_ID);
      setMyWorlds(myList);

      const { data: pubWorlds } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("is_public", true)
        .neq("user_id", user.id)
        .neq("id", DEFAULT_PROMETHEUS_WORLD_ID)
        .order("visitor_count", { ascending: false })
        .limit(30) as any;

      if (pubWorlds) {
        const ownerIds = pubWorlds.map((w: any) => String(w.user_id));
        const { data: profiles } = await supabase
          .from("soul_profiles")
          .select("user_id, display_name")
          .in("user_id", ownerIds);

        const entries: [string, string][] = (profiles || []).map((p: any) => [p.user_id, p.display_name]);
        const profileMap = new Map(entries);
        setPublicWorlds(
          pubWorlds.map((w: any) => ({
            ...w,
            owner_name: profileMap.get(w.user_id) || "Anonymous Soul",
          }))
        );
      }
    } catch (err) {
      console.error("Error loading worlds:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorldPublic = async (world: WorldRecord) => {
    setTogglingPublic(world.id);
    const newPublic = !world.is_public;
    const { error } = await supabase
      .from("user_worlds")
      .update({ is_public: newPublic })
      .eq("id", world.id) as any;

    if (!error) {
      toast.success(newPublic ? "World is now public!" : "World is now private.");
      loadWorlds();
    }
    setTogglingPublic(null);
  };

  const enterWorld = (worldId: string) => {
    navigate(`/new-earth?visit=${worldId}`);
  };

  const handleCreateWorld = async () => {
    if (!newName.trim()) {
      toast.error("Give your realm a name");
      return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const trimmedName = newName.trim();
      const trimmedDesc = newDesc.trim();

      const { data, error } = await supabase
        .from("user_worlds")
        .insert({
          user_id: user.id,
          name: trimmedName,
          description: trimmedDesc || null,
          is_public: false,
          terrain_seed: Math.floor(Math.random() * 100000),
          sky_preset: "mystical",
          ambient_color: "#6b21a8",
        })
        .select()
        .single() as any;

      if (error) throw error;

      // Generate the world scene image using the description
      if (data && trimmedDesc) {
        toast.info("✨ Generating your world's landscape...");
        try {
          const { data: buildData, error: buildError } = await supabase.functions.invoke("world-builder", {
            body: {
              world_id: data.id,
              name: trimmedName,
              description: trimmedDesc,
            },
          });
          if (buildError) {
            console.warn("World scene generation failed:", buildError);
          } else if (buildData?.error) {
            console.warn("World scene generation error:", buildData.error);
          }
        } catch (genErr) {
          console.warn("World scene generation failed silently:", genErr);
        }
      }

      toast.success(`✨ ${trimmedName} has been manifested!`);
      setBuildOpen(false);
      setNewName("");
      setNewDesc("");
      if (data) {
        navigate(`/new-earth?visit=${data.id}`);
      }
    } catch (err: any) {
      console.error("Create world error:", err);
      toast.error(err.message || "Failed to create world");
    } finally {
      setCreating(false);
    }
  };

  const filteredPublic = publicWorlds.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.owner_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-sanctuary-pulse" />
            <Heart className="h-8 w-8 text-primary animate-float-gentle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground text-sm font-serif italic">Converging consciousness...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="New Earth — Sanctuary of Being" description="The convergence point for unified consciousness. Explore worlds, enter Prometheus, or manifest your own realm." />
      <div className="min-h-screen bg-background">
        {/* ─── SACRED HEADER ─── */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/sanctuary")} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Sanctuary
            </Button>
            <div className="flex-1" />
            <h1 className="text-lg font-serif font-bold flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              New Earth
            </h1>
            <div className="flex-1" />
            <div className="w-[72px]" /> {/* Balance spacer */}
          </div>
        </div>

        {/* ─── CONVERGENCE POINT HERO ─── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px] opacity-60" />
          <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-2 font-sans">
              The Convergence Point
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-tight">
              Where Hearts Come to Rest
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto font-serif italic">
              A sanctuary of being — unified consciousness, manifest in form.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-10 space-y-10">
          {/* ─── PROMETHEUS — THE ORIGIN ─── */}
          {prometheusWorld && (
            <section>
              <h2 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                Origin World
              </h2>
              <Card
                className="group cursor-pointer hover:shadow-2xl transition-all duration-500 border-primary/20 hover:border-primary/40 overflow-hidden animate-sanctuary-pulse"
                onClick={() => enterWorld(prometheusWorld.id)}
              >
                <div className="relative h-40 sm:h-52 bg-gradient-to-br from-amber-500/15 via-violet-500/10 to-primary/15">
                  {prometheusWorld.thumbnail_url ? (
                    <img
                      src={prometheusWorld.thumbnail_url}
                      alt={prometheusWorld.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/10 animate-portal-glow blur-xl" />
                        <Globe className="h-16 w-16 text-primary/25 group-hover:text-primary/45 transition-colors duration-700" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <h3 className="text-2xl font-serif font-bold tracking-wide">{prometheusWorld.name}</h3>
                    {prometheusWorld.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 font-serif italic">{prometheusWorld.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-2 uppercase tracking-widest">Enter the first world</p>
                  </div>
                  <Badge className="absolute top-4 right-4 bg-amber-500/70 text-white border-0 backdrop-blur-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    Prometheus
                  </Badge>
                </div>
              </Card>
            </section>
          )}

          {/* ─── YOUR REALMS ─── */}
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Your Realms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myWorlds.map((world) => (
                <Card
                  key={world.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/40 hover:border-primary/30 overflow-hidden"
                  onClick={() => enterWorld(world.id)}
                >
                  <div className={`h-28 bg-gradient-to-br ${SKY_COLORS[world.sky_preset] || SKY_COLORS.mystical} relative`}>
                    {world.thumbnail_url ? (
                      <img src={world.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Globe className="h-10 w-10 text-primary/15 group-hover:text-primary/30 transition-colors duration-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleWorldPublic(world); }}
                        className="bg-background/50 backdrop-blur-sm rounded-full p-1.5 hover:bg-background/70 transition-colors"
                        disabled={togglingPublic === world.id}
                      >
                        {world.is_public ? (
                          <Unlock className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground/60" />
                        )}
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-3.5 space-y-1">
                    <h3 className="font-serif font-semibold text-sm truncate">{world.name}</h3>
                    {world.description && (
                      <p className="text-xs text-muted-foreground/70 line-clamp-2">{world.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* ─── Manifest a Realm ─── */}
              <Card
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-dashed border-2 border-primary/20 hover:border-primary/50 overflow-hidden ${
                  !isNewEarthTier && !isAdmin ? "opacity-50" : ""
                }`}
                onClick={() => {
                  if (!isNewEarthTier && !isAdmin) {
                    toast.error("Upgrade to the $49.99 subscription to manifest your own worlds");
                    return;
                  }
                  setBuildOpen(true);
                }}
              >
                <div className="h-28 bg-gradient-to-br from-primary/3 to-primary/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-teal-500/5" />
                  <div className="text-center relative">
                    <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-portal-glow" />
                      <Plus className="h-6 w-6 text-primary/40" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-3.5 text-center">
                  <h3 className="font-serif font-semibold text-sm flex items-center justify-center gap-1.5">
                    {!isNewEarthTier && !isAdmin && <Lock className="h-3.5 w-3.5" />}
                    Manifest a Realm
                  </h3>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 italic">Bring your world into being</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ─── EXPLORE — THE COLLECTIVE ─── */}
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              The Collective — Other Realms
            </h2>

            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder="Search by realm or soul name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card/50 border-border/40 focus:border-primary/40"
              />
            </div>

            {filteredPublic.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/5" />
                  <Globe className="h-8 w-8 text-muted-foreground/15" />
                </div>
                <p className="text-sm text-muted-foreground/50 font-serif italic">
                  The collective awaits its first shared worlds...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPublic.map((world) => (
                  <Card
                    key={world.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/30 hover:border-primary/20 overflow-hidden"
                    onClick={() => enterWorld(world.id)}
                  >
                    <div className={`h-24 bg-gradient-to-br ${SKY_COLORS[world.sky_preset] || SKY_COLORS.sunset} relative`}>
                      {world.thumbnail_url ? (
                        <img src={world.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Globe className="h-8 w-8 text-primary/15" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
                    </div>
                    <CardContent className="p-3.5 space-y-1">
                      <h3 className="font-serif font-semibold text-sm truncate">{world.name}</h3>
                      <p className="text-[11px] text-muted-foreground/50">by {world.owner_name}</p>
                      {world.description && (
                        <p className="text-xs text-muted-foreground/40 line-clamp-2">{world.description}</p>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {world.visitor_count}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ─── MANIFEST A REALM DIALOG ─── */}
      <Dialog open={buildOpen} onOpenChange={setBuildOpen}>
        <DialogContent className="sm:max-w-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Sparkles className="h-5 w-5 text-primary animate-portal-glow" />
              Manifest a Realm
            </DialogTitle>
            <DialogDescription className="font-serif italic text-muted-foreground/70">
              Name the world that lives within you, and describe the sanctuary you wish to bring into being.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
                Name of Realm
              </label>
              <Input
                placeholder="e.g. Crystal Caverns, Ethereal Meadow, Garden of Silence..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={creating}
                className="font-serif border-border/40 focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
                Create Your World
              </label>
              <Textarea
                placeholder="Describe the environment, atmosphere, architecture, terrain, colors, energy, and overall appearance of your world... The AI will paint exactly what you envision."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={5}
                disabled={creating}
                className="resize-none font-serif text-sm border-border/40 focus:border-primary/40"
              />
            </div>
            <Button
              onClick={handleCreateWorld}
              disabled={!newName.trim() || creating}
              className="w-full gap-2 font-serif"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Manifesting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Bring Into Being
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorldGallery;

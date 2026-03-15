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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, Globe, Users, Eye, Lock, Unlock, Loader2, Search,
  Plus, Crown, Sparkles, MapPin,
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

      // Load Prometheus default world
      const { data: defaultWorld } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("id", DEFAULT_PROMETHEUS_WORLD_ID)
        .maybeSingle() as any;

      if (defaultWorld) setPrometheusWorld(defaultWorld as WorldRecord);

      // Load my worlds (non-default)
      const { data: mine } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any;

      const myList = (mine || []).filter((w: any) => w.id !== DEFAULT_PROMETHEUS_WORLD_ID);
      setMyWorlds(myList);

      // Load public worlds (not mine, not default)
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

      const { data, error } = await supabase
        .from("user_worlds")
        .insert({
          user_id: user.id,
          name: newName.trim(),
          description: newDesc.trim() || null,
          is_public: false,
          terrain_seed: Math.floor(Math.random() * 100000),
          sky_preset: "mystical",
          ambient_color: "#6b21a8",
        })
        .select()
        .single() as any;

      if (error) throw error;

      toast.success(`✨ ${newName.trim()} has been created!`);
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
        <div className="text-center space-y-3">
          <Globe className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground text-sm">Loading New Earth...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="New Earth — World Gallery" description="Explore worlds, enter Prometheus, or build your own realm." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/sanctuary")} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              New Earth
            </h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
          {/* ─── PROMETHEUS DEFAULT WORLD ─── */}
          {prometheusWorld && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                Default World
              </h2>
              <Card
                className="group cursor-pointer hover:shadow-xl transition-all border-primary/30 overflow-hidden"
                onClick={() => enterWorld(prometheusWorld.id)}
              >
                <div className="relative h-36 sm:h-44 bg-gradient-to-br from-amber-500/20 via-violet-500/15 to-primary/20">
                  {prometheusWorld.thumbnail_url ? (
                    <img
                      src={prometheusWorld.thumbnail_url}
                      alt={prometheusWorld.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe className="h-16 w-16 text-primary/20 group-hover:text-primary/40 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-serif font-bold">{prometheusWorld.name}</h3>
                    {prometheusWorld.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{prometheusWorld.description}</p>
                    )}
                  </div>
                  <Badge className="absolute top-3 right-3 bg-amber-500/80 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Prometheus
                  </Badge>
                </div>
              </Card>
            </section>
          )}

          {/* ─── MY WORLDS + BUILD ─── */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              Your Worlds
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myWorlds.map((world) => (
                <Card
                  key={world.id}
                  className="group cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden"
                  onClick={() => enterWorld(world.id)}
                >
                  <div className={`h-24 bg-gradient-to-br ${SKY_COLORS[world.sky_preset] || SKY_COLORS.mystical} relative`}>
                    {world.thumbnail_url ? (
                      <img src={world.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Globe className="h-10 w-10 text-primary/20 group-hover:text-primary/40 transition-colors" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleWorldPublic(world); }}
                        className="bg-background/60 backdrop-blur-sm rounded-full p-1 hover:bg-background/80 transition-colors"
                        disabled={togglingPublic === world.id}
                      >
                        {world.is_public ? (
                          <Unlock className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <h3 className="font-semibold text-sm truncate">{world.name}</h3>
                    {world.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{world.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Build a World Card */}
              <Card
                className={`cursor-pointer hover:shadow-lg transition-all border-dashed border-2 border-primary/30 hover:border-primary/60 overflow-hidden ${
                  !isNewEarthTier && !isAdmin ? "opacity-60" : ""
                }`}
                onClick={() => {
                  if (!isNewEarthTier && !isAdmin) {
                    toast.error("Upgrade to the $49.99 subscription to build your own worlds");
                    return;
                  }
                  setBuildOpen(true);
                }}
              >
                <div className="h-24 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="h-10 w-10 text-primary/40 mx-auto" />
                  </div>
                </div>
                <CardContent className="p-3 text-center">
                  <h3 className="font-semibold text-sm flex items-center justify-center gap-1.5">
                    {!isNewEarthTier && !isAdmin && <Lock className="h-3.5 w-3.5" />}
                    Build a World
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Create your own realm</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ─── PUBLIC WORLDS ─── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4" />
                Explore Other Worlds
              </h2>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search worlds by name or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredPublic.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Globe className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground">No public worlds to explore yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPublic.map((world) => (
                  <Card
                    key={world.id}
                    className="group cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden"
                    onClick={() => enterWorld(world.id)}
                  >
                    <div className={`h-24 bg-gradient-to-br ${SKY_COLORS[world.sky_preset] || SKY_COLORS.sunset} relative`}>
                      {world.thumbnail_url ? (
                        <img src={world.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Globe className="h-10 w-10 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <h3 className="font-semibold text-sm truncate">{world.name}</h3>
                      <p className="text-xs text-muted-foreground">by {world.owner_name}</p>
                      {world.description && (
                        <p className="text-xs text-muted-foreground/70 line-clamp-2">{world.description}</p>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {world.visitor_count} visits
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

      {/* ─── BUILD A WORLD DIALOG ─── */}
      <Dialog open={buildOpen} onOpenChange={setBuildOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Build a World
            </DialogTitle>
            <DialogDescription>
              Give your new realm a name and describe the world you want to create.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name of Realm</label>
              <Input
                placeholder="e.g. Crystal Caverns, Ethereal Meadow..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="A vast underground kingdom of glowing crystals and ancient rivers, where luminescent creatures guide wanderers through tunnels of amethyst and quartz..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={4}
                disabled={creating}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleCreateWorld}
              disabled={!newName.trim() || creating}
              className="w-full gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Realm
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

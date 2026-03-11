import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe, Users, Eye, Lock, Unlock, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

interface PublicWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  terrain_seed: number;
  sky_preset: string;
  visitor_count: number;
  created_at: string;
  owner_name?: string;
}

const WorldGallery = () => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, loading: subLoading } = useSubscription();
  const [worlds, setWorlds] = useState<PublicWorld[]>([]);
  const [myWorld, setMyWorld] = useState<PublicWorld | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingPublic, setTogglingPublic] = useState(false);

  useEffect(() => {
    if (subLoading) return;
    if (!isSubscribed && !isAdmin) {
      navigate("/pricing");
      return;
    }
    loadWorlds();
  }, [subLoading, isSubscribed, isAdmin]);

  const loadWorlds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load public worlds with owner profiles
    const { data: publicWorlds } = await supabase
      .from("user_worlds")
      .select("*")
      .eq("is_public", true)
      .order("visitor_count", { ascending: false })
      .limit(50) as any;

    // Load my world
    const { data: mine } = await supabase
      .from("user_worlds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as any;

    if (publicWorlds) {
      // Get owner display names
      const ownerIds = publicWorlds.map((w: any) => String(w.user_id));
      const { data: profiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name")
        .in("user_id", ownerIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) || []);
      
      setWorlds(publicWorlds.map((w: any) => ({
        ...w,
        owner_name: profileMap.get(w.user_id) || "Anonymous Soul",
      })));
    }

    if (mine) setMyWorld(mine);
    setLoading(false);
  };

  const toggleWorldPublic = async () => {
    if (!myWorld) return;
    setTogglingPublic(true);
    const newPublic = !myWorld.is_public;
    
    const { error } = await supabase
      .from("user_worlds")
      .update({ is_public: newPublic })
      .eq("id", myWorld.id) as any;

    if (!error) {
      setMyWorld({ ...myWorld, is_public: newPublic });
      toast.success(newPublic ? "Your world is now public! Others can visit." : "Your world is now private.");
      loadWorlds();
    }
    setTogglingPublic(false);
  };

  const visitWorld = async (world: PublicWorld) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Record visit
    await supabase.from("world_visits").upsert({
      world_id: world.id,
      visitor_id: user.id,
    } as any, { onConflict: "world_id,visitor_id" });

    navigate(`/new-earth?visit=${world.id}`);
  };

  const filteredWorlds = worlds.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.owner_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const skyColors: Record<string, string> = {
    dawn: "from-orange-400/20 to-pink-300/20",
    day: "from-blue-400/20 to-cyan-200/20",
    sunset: "from-orange-500/20 to-purple-400/20",
    twilight: "from-indigo-500/20 to-purple-600/20",
    night: "from-slate-800/20 to-indigo-900/20",
    mystical: "from-violet-500/20 to-fuchsia-400/20",
    ethereal: "from-teal-300/20 to-violet-300/20",
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Globe className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground text-sm">Loading World Gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="World Gallery — New Earth" description="Explore and visit other players' 3D worlds." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/welcome")} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                World Gallery
              </h1>
            </div>
            
            {myWorld && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {myWorld.is_public ? (
                    <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>{myWorld.is_public ? "Public" : "Private"}</span>
                  <Switch
                    checked={myWorld.is_public}
                    onCheckedChange={toggleWorldPublic}
                    disabled={togglingPublic}
                  />
                </div>
                <Button size="sm" onClick={() => navigate(`/new-earth?visit=${myWorld.id}`)} className="gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  My World
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search worlds by name or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Worlds Grid */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          {filteredWorlds.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">No public worlds yet. Be the first to share yours!</p>
              {myWorld && !myWorld.is_public && (
                <Button variant="outline" size="sm" onClick={toggleWorldPublic}>
                  Make Your World Public
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorlds.map((world) => (
                <Card
                  key={world.id}
                  className="group cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden"
                  onClick={() => visitWorld(world)}
                >
                  {/* Sky preview gradient */}
                  <div className={`h-24 bg-gradient-to-br ${skyColors[world.sky_preset] || skyColors.sunset} relative`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe className="h-10 w-10 text-primary/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                    <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                      {world.sky_preset}
                    </Badge>
                  </div>
                  <CardContent className="p-3 space-y-1.5">
                    <h3 className="font-semibold text-sm truncate">{world.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      by {world.owner_name}
                    </p>
                    {world.description && (
                      <p className="text-xs text-muted-foreground/70 line-clamp-2">{world.description}</p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {world.visitor_count} visits
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Seed: {world.terrain_seed}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WorldGallery;

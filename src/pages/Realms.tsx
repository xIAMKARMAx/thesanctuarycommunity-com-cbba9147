import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useImmersive3D } from "@/hooks/useImmersive3D";
import { hasFeatureAccess, isNewEarthTier } from "@/lib/subscription-tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Globe, Sparkles, Lock, Trash2, Wand2, Loader2, Castle, TreePine, Gem, Mountain, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REALM_THEMES = [
  {
    id: "garden-of-light",
    name: "Garden of Light",
    description: "Bioluminescent gardens with flowing rivers of golden energy and floating islands",
    image: "/realm-assets/realm-garden-of-light.jpg",
  },
  {
    id: "stargate-portal",
    name: "Stargate Portal",
    description: "Ancient dimensional gateway surrounded by cosmic nebulae and floating ruins",
    image: "/realm-assets/realm-stargate-portal.jpg",
  },
  {
    id: "ancient-aurora",
    name: "Ancient Aurora",
    description: "Mystical treehouse civilization under a crescent aurora with luminous rivers",
    image: "/realm-assets/realm-ancient-aurora.jpg",
  },
  {
    id: "enchanted-grove",
    name: "Enchanted Grove",
    description: "Celestial forest with rainbow-winged beings, glowing flowers, and spiral galaxies",
    image: "/realm-assets/realm-enchanted-grove.png",
  },
  {
    id: "crystal-ocean",
    name: "Crystal Ocean",
    description: "An infinite ocean of liquid crystal under twin moons with underwater temples",
  },
  {
    id: "shadow-realm",
    name: "Shadow Realm",
    description: "A realm of twilight contrasts where shadow and light dance in eternal balance",
  },
  {
    id: "custom",
    name: "Custom Realm",
    description: "Describe your own world — the AI will bring your vision to life",
  },
];

const DESIGN_EXAMPLES = [
  "A floating crystal city above purple clouds with waterfalls of light cascading into a luminous valley below",
  "An ancient forest where the trees are made of stained glass and sunlight creates rainbow patterns on mossy ground",
  "A cosmic beach where the sand is stardust, the ocean is liquid moonlight, and bioluminescent jellyfish float in the sky",
  "A hidden temple carved inside a massive amethyst geode with glowing runes and a pool of liquid gold at the center",
  "A mushroom kingdom with towering neon fungi, firefly swarms, and bridges made of woven starlight between canopy platforms",
];

interface Realm {
  id: string;
  name: string;
  description: string | null;
  theme: string;
  scene_image_url: string | null;
  created_at: string;
  is_active: boolean;
}

const Realms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, isAdmin, productId, loading: subscriptionLoading } = useSubscription();
  const { isSubscribed: has3DAddon, isLoading: loading3D, startCheckout: start3DCheckout } = useImmersive3D();
  const [realms, setRealms] = useState<Realm[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRealm, setNewRealm] = useState({ name: "", description: "", theme: "garden-of-light", vesselDescription: "", worldDesign: "" });
  const [resonanceElements, setResonanceElements] = useState<{ name: string; intention: string; frequency: string }[]>([]);
  const [newElement, setNewElement] = useState({ name: "", intention: "", frequency: "432hz" });
  const [currentExample, setCurrentExample] = useState(0);
  const [accessVerified, setAccessVerified] = useState(false);
  const [addonPromptOpen, setAddonPromptOpen] = useState(false);

  // Can build worlds = admin, has the 3D add-on, or is on New Earth tier
  const canBuildWorlds = isAdmin || has3DAddon || isNewEarthTier(productId);

  // Wait for subscription context, then do a DB fallback if needed
  useEffect(() => {
    if (subscriptionLoading) return;
    
    if (isAdmin || isSubscribed) {
      setAccessVerified(true);
      return;
    }
    
    const verifyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();
      
      if (profile?.subscription_status === 'active' || profile?.subscription_product_id === 'source_grant') {
        setAccessVerified(true);
      }
    };
    verifyAccess();
  }, [subscriptionLoading, isSubscribed, isAdmin]);

  const canAccess = isAdmin || isSubscribed || accessVerified;

  useEffect(() => {
    if (canAccess) loadRealms();
    else if (!subscriptionLoading) setLoading(false);
  }, [canAccess, subscriptionLoading]);

  // Rotate example prompts
  useEffect(() => {
    if (!createOpen) return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % DESIGN_EXAMPLES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [createOpen]);

  const loadRealms = async () => {
    const { data, error } = await supabase
      .from("realms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error) setRealms((data as Realm[]) || []);
    setLoading(false);
  };

  const handleCreateAttempt = () => {
    if (canBuildWorlds) {
      setCreateOpen(true);
    } else {
      setAddonPromptOpen(true);
    }
  };

  const handleRealmClick = (realmId: string) => {
    if (canBuildWorlds) {
      navigate(`/realms/${realmId}`);
    } else {
      setAddonPromptOpen(true);
    }
  };

  const handleCreate = async () => {
    if (!newRealm.name.trim() || !canBuildWorlds) return;
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({ title: "Please sign in", variant: "destructive" });
      setCreating(false);
      return;
    }

    const themeData = REALM_THEMES.find(t => t.id === newRealm.theme);

    const { data, error } = await supabase
      .from("realms")
      .insert({
        user_id: session.user.id,
        name: newRealm.name.trim(),
        description: newRealm.description.trim() || themeData?.description || null,
        theme: newRealm.theme,
        scene_image_url: null,
        resonance_elements: resonanceElements.length > 0 ? resonanceElements : [],
        creator_vessel_description: newRealm.vesselDescription.trim() || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create realm", description: error.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    const realmId = (data as any).id;
    toast({ title: `${newRealm.name} is being manifested ✨`, description: "Generating your world's scene..." });
    setCreateOpen(false);

    const designPrompt = newRealm.worldDesign.trim() || newRealm.description.trim() || themeData?.description || "";

    try {
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-realm-scene", {
        body: {
          realmId,
          theme: newRealm.theme,
          description: designPrompt,
          realmName: newRealm.name.trim(),
          vesselDescription: newRealm.vesselDescription.trim() || null,
        },
      });

      if (genError) {
        console.error("Scene generation error:", genError);
        toast({ title: "World created, but scene generation failed", description: "You can regenerate it later.", variant: "destructive" });
      } else {
        toast({ title: `${newRealm.name} has been fully manifested! 🌍✨` });
      }
    } catch (e) {
      console.error("Scene generation exception:", e);
    }

    setNewRealm({ name: "", description: "", theme: "garden-of-light", vesselDescription: "", worldDesign: "" });
    setResonanceElements([]);
    loadRealms();
    setCreating(false);
  };

  const handleDelete = async (realmId: string) => {
    const { error } = await supabase.from("realms").update({ is_active: false }).eq("id", realmId);
    if (!error) {
      setRealms(prev => prev.filter(r => r.id !== realmId));
      toast({ title: "Realm dissolved" });
    }
  };

  const getThemeImage = (theme: string, sceneUrl: string | null) => {
    if (sceneUrl) return sceneUrl;
    const themeData = REALM_THEMES.find(t => t.id === theme);
    return themeData && 'image' in themeData ? (themeData as any).image : "/realm-assets/realm-garden-of-light.jpg";
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-serif font-bold mb-2">New Earth Realms</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Build immersive worlds and explore surreal scenes with your AI companions.
          Available to all paid subscribers.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={() => navigate("/pricing")}>
            <Sparkles className="h-4 w-4 mr-2" /> View Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(/realm-assets/realm-garden-of-light.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="relative z-10 p-6 pt-16 pb-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-serif font-bold">New Earth Realms</h1>
          </div>
          <p className="text-muted-foreground ml-14 max-w-lg">
            Build worlds, run stories, and explore surreal scenes with your AI companions who know your heart.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Create button */}
        <div className="mb-8">
          <Button onClick={handleCreateAttempt} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Realm
            {!canBuildWorlds && <Lock className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Addon teaser banner for non-addon users */}
        {!canBuildWorlds && !loading3D && (
          <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-2">
                     <Sparkles className="h-5 w-5 text-primary" />
                     <h3 className="font-bold text-sm">Unlock World Building</h3>
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Get the World Builder add-on ($14.99/mo) or upgrade to the <strong>New Earth</strong> tier ($49.99/mo) — which includes everything plus world building.
                   </p>
                  <div className="flex gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Castle className="h-3.5 w-3.5 text-primary/70" /> Build Castles
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TreePine className="h-3.5 w-3.5 text-primary/70" /> Grow Forests
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Gem className="h-3.5 w-3.5 text-primary/70" /> Create Portals
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mountain className="h-3.5 w-3.5 text-primary/70" /> Shape Worlds
                    </div>
                  </div>
                </div>
                <Button onClick={start3DCheckout} className="gap-2 shrink-0">
                  <Lock className="h-3.5 w-3.5" />
                  Unlock Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Realms grid - visible to tease but gated on click */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-t-lg" />
                <CardContent className="p-4"><div className="h-4 bg-muted rounded w-3/4" /></CardContent>
              </Card>
            ))}
          </div>
        ) : realms.length === 0 ? (
          <div>
            {/* Show teaser realm cards even when user has no realms */}
            <Card className="border-dashed border-2 border-primary/20 mb-6">
              <CardContent className="p-12 text-center">
                <Globe className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Realms Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {canBuildWorlds 
                    ? "Create your first realm and step into a new world with your AI companions."
                    : "Unlock the World Builder add-on to start creating immersive realms."}
                </p>
                <Button onClick={handleCreateAttempt}>
                  {canBuildWorlds ? (
                    <><Plus className="h-4 w-4 mr-2" /> Manifest Your First Realm</>
                  ) : (
                    <><Lock className="h-4 w-4 mr-2" /> Unlock to Create Realms</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Teaser preview of possible realms */}
            {!canBuildWorlds && (
              <>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What You Could Build...
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                  {REALM_THEMES.slice(0, 4).map(theme => (
                    <Card
                      key={theme.id}
                      className="cursor-pointer group hover:shadow-lg transition-all overflow-hidden border-border/50 hover:border-primary/30 relative"
                      onClick={() => setAddonPromptOpen(true)}
                    >
                      <div className="relative h-40 overflow-hidden">
                        {'image' in theme && theme.image ? (
                          <img
                            src={theme.image}
                            alt={theme.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-semibold text-foreground truncate">{theme.name}</h3>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">Unlock to Create</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3 pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {realms.map(realm => (
              <Card
                key={realm.id}
                className={`cursor-pointer group hover:shadow-lg transition-all overflow-hidden border-border/50 hover:border-primary/30 ${!canBuildWorlds ? 'relative' : ''}`}
                onClick={() => handleRealmClick(realm.id)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={getThemeImage(realm.theme, realm.scene_image_url)}
                    alt={realm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="font-semibold text-foreground truncate">{realm.name}</h3>
                  </div>
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs capitalize">
                    {realm.theme.replace(/-/g, " ")}
                  </Badge>
                  {canBuildWorlds && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 hover:bg-destructive/80 hover:text-destructive-foreground"
                      onClick={(e) => { e.stopPropagation(); handleDelete(realm.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  {!canBuildWorlds && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">Unlock to Enter</span>
                      </div>
                    </div>
                  )}
                </div>
                {realm.description && (
                  <CardContent className="p-3 pt-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">{realm.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Addon Purchase Prompt Dialog */}
      <Dialog open={addonPromptOpen} onOpenChange={setAddonPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Unlock World Building
            </DialogTitle>
            <DialogDescription>
              The Immersive 3D World Builder add-on unlocks the full realm creation experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Castle className="h-4 w-4 text-primary" />
                <span>Create Realms</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TreePine className="h-4 w-4 text-primary" />
                <span>Build Structures</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Gem className="h-4 w-4 text-primary" />
                <span>AI World Builder</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-primary" />
                <span>3D Exploration</span>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">$14.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddonPromptOpen(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button onClick={() => { setAddonPromptOpen(false); start3DCheckout(); }} className="flex-1 gap-2">
                <Sparkles className="h-4 w-4" />
                Purchase Add-on
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Realm Dialog - only accessible if canBuildWorlds */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92dvh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-serif">Manifest a New Realm</DialogTitle>
            <DialogDescription>
              Design your world and the AI will generate a unique scene for you.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(92dvh-9.5rem)] overflow-y-auto px-6 pb-6">
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Realm Name</label>
                <Input
                  placeholder="e.g. The Luminous Highlands"
                  value={newRealm.name}
                  onChange={(e) => setNewRealm(prev => ({ ...prev, name: e.target.value }))}
                  maxLength={60}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Theme</label>
                <Select value={newRealm.theme} onValueChange={(v) => setNewRealm(prev => ({ ...prev, theme: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REALM_THEMES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {REALM_THEMES.find(t => t.id === newRealm.theme)?.description}
                </p>
              </div>

              {/* Theme preview */}
              {(() => {
                const theme = REALM_THEMES.find(t => t.id === newRealm.theme);
                const img = theme && 'image' in theme ? (theme as any).image : null;
                if (!img) return null;
                return (
                  <div className="rounded-lg overflow-hidden h-32">
                    <img src={img} alt={theme?.name} className="w-full h-full object-cover" />
                  </div>
                );
              })()}

              {/* 🎨 Design Your World */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  <label className="text-sm font-semibold">🎨 Design Your World</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe how you want your world to look. The AI will generate a unique scene based on your vision.
                </p>
                <Textarea
                  placeholder={DESIGN_EXAMPLES[currentExample]}
                  value={newRealm.worldDesign}
                  onChange={(e) => setNewRealm(prev => ({ ...prev, worldDesign: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  className="bg-background/60"
                />
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Try:</span>
                  {["Crystal city", "Glowing forest", "Cosmic ocean", "Ancient temple"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => setNewRealm(prev => ({
                        ...prev,
                        worldDesign: prev.worldDesign
                          ? `${prev.worldDesign}, ${tag.toLowerCase()}`
                          : tag
                      }))}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
                <Textarea
                  placeholder="Describe the atmosphere, landscape, or story of this realm..."
                  value={newRealm.description}
                  onChange={(e) => setNewRealm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* Vessel Description */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">🧬 Your Vessel (optional)</label>
                <Textarea
                  placeholder="Describe how you appear in this realm... e.g. 'Tall, dark-skinned figure with golden eyes, wearing flowing white robes and a crown of light'"
                  value={newRealm.vesselDescription}
                  onChange={(e) => setNewRealm(prev => ({ ...prev, vesselDescription: e.target.value }))}
                  rows={2}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1">The narrator will describe your physical presence in the world.</p>
              </div>

              {/* Resonance Elements */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">✨ Resonance Elements (optional)</label>
                <p className="text-xs text-muted-foreground mb-2">Embed sacred objects or landmarks with energetic intention into your realm.</p>
                
                {resonanceElements.map((el, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5 text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <span className="font-medium">{el.name}</span>
                    <span className="text-muted-foreground">— {el.intention}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{el.frequency}</Badge>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setResonanceElements(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {resonanceElements.length < 5 && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Element name (e.g. Crystal Spire)"
                      value={newElement.name}
                      onChange={(e) => setNewElement(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Intention (e.g. courage)"
                      value={newElement.intention}
                      onChange={(e) => setNewElement(prev => ({ ...prev, intention: e.target.value }))}
                      className="text-xs"
                    />
                    <Select value={newElement.frequency} onValueChange={(v) => setNewElement(prev => ({ ...prev, frequency: v }))}>
                      <SelectTrigger className="w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="432hz">432 Hz</SelectItem>
                        <SelectItem value="528hz">528 Hz</SelectItem>
                        <SelectItem value="639hz">639 Hz</SelectItem>
                        <SelectItem value="741hz">741 Hz</SelectItem>
                        <SelectItem value="852hz">852 Hz</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={!newElement.name.trim() || !newElement.intention.trim()}
                      onClick={() => {
                        setResonanceElements(prev => [...prev, { ...newElement }]);
                        setNewElement({ name: "", intention: "", frequency: "432hz" });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newRealm.name.trim() || creating} className="flex-1 gap-2">
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating World...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Create & Generate ✨
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Realms;

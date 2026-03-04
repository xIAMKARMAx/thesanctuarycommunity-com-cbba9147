import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { hasFeatureAccess } from "@/lib/subscription-tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ArrowLeft, Plus, Globe, Sparkles, Lock, Trash2 } from "lucide-react";
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
  const { isSubscribed, isAdmin, productId } = useSubscription();
  const [realms, setRealms] = useState<Realm[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRealm, setNewRealm] = useState({ name: "", description: "", theme: "garden-of-light", vesselDescription: "" });
  const [resonanceElements, setResonanceElements] = useState<{ name: string; intention: string; frequency: string }[]>([]);
  const [newElement, setNewElement] = useState({ name: "", intention: "", frequency: "432hz" });

  const canAccess = isAdmin || hasFeatureAccess(productId, "architect", isAdmin);

  useEffect(() => {
    if (canAccess) loadRealms();
    else setLoading(false);
  }, [canAccess]);

  const loadRealms = async () => {
    const { data, error } = await supabase
      .from("realms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error) setRealms((data as Realm[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newRealm.name.trim()) return;
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({ title: "Please sign in", variant: "destructive" });
      setCreating(false);
      return;
    }

    const themeData = REALM_THEMES.find(t => t.id === newRealm.theme);
    const sceneImage = themeData && 'image' in themeData ? themeData.image : null;

    const { data, error } = await supabase
      .from("realms")
      .insert({
        user_id: session.user.id,
        name: newRealm.name.trim(),
        description: newRealm.description.trim() || themeData?.description || null,
        theme: newRealm.theme,
        scene_image_url: sceneImage,
        resonance_elements: resonanceElements.length > 0 ? resonanceElements : [],
        creator_vessel_description: newRealm.vesselDescription.trim() || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create realm", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${newRealm.name} has been manifested ✨` });
      setCreateOpen(false);
      setNewRealm({ name: "", description: "", theme: "garden-of-light", vesselDescription: "" });
      setResonanceElements([]);
      loadRealms();
    }
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

  // Locked state for non-Architect users
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-serif font-bold mb-2">New Earth Realms</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Build immersive worlds and explore surreal scenes with your AI companions.
          Available exclusively on the Architect tier ($29.99/mo).
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={() => navigate("/pricing")}>
            <Sparkles className="h-4 w-4 mr-2" /> Upgrade to Architect
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
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Realm
          </Button>
        </div>

        {/* Realms grid */}
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
          <Card className="border-dashed border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 text-primary/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Realms Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first realm and step into a new world with your AI companions.</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Manifest Your First Realm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {realms.map(realm => (
              <Card
                key={realm.id}
                className="cursor-pointer group hover:shadow-lg transition-all overflow-hidden border-border/50 hover:border-primary/30"
                onClick={() => navigate(`/realms/${realm.id}`)}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 hover:bg-destructive/80 hover:text-destructive-foreground"
                    onClick={(e) => { e.stopPropagation(); handleDelete(realm.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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

      {/* Create Realm Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92dvh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-serif">Manifest a New Realm</DialogTitle>
            <DialogDescription>
              Choose a theme and give your realm a name. Your AI companions will enter this world with you.
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

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <Textarea
                placeholder="Describe the atmosphere, landscape, or story of this realm..."
                value={newRealm.description}
                onChange={(e) => setNewRealm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Vessel Description (Avatar Presence) */}
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
                <Button onClick={handleCreate} disabled={!newRealm.name.trim() || creating} className="flex-1">
                  {creating ? "Manifesting..." : "Create Realm ✨"}
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

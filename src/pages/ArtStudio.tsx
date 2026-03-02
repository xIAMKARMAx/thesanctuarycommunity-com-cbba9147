import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Sparkles, Download, Heart, Trash2, ArrowLeft, Loader2, ImagePlus, Wand2, Crown, Lock } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const STYLE_PRESETS = [
  { id: "none", label: "No Style", icon: "✨" },
  { id: "watercolor", label: "Watercolor", icon: "🎨" },
  { id: "oil_painting", label: "Oil Painting", icon: "🖼️" },
  { id: "anime", label: "Anime", icon: "⚡" },
  { id: "cyberpunk", label: "Cyberpunk", icon: "🌃" },
  { id: "fantasy", label: "Fantasy", icon: "🧙" },
  { id: "portrait", label: "Portrait", icon: "👤" },
  { id: "landscape", label: "Landscape", icon: "🏔️" },
  { id: "abstract", label: "Abstract", icon: "🔮" },
  { id: "minimalist", label: "Minimalist", icon: "◻️" },
  { id: "surreal", label: "Surreal", icon: "🌀" },
  { id: "celestial", label: "Celestial", icon: "✨" },
  { id: "sacred_geometry", label: "Sacred Geometry", icon: "📐" },
];

interface ArtCreation {
  id: string;
  prompt: string;
  style_preset: string | null;
  image_url: string;
  creation_type: string;
  is_favorited: boolean;
  created_at: string;
}

const ArtStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, productId } = useSubscription();
  const { toast } = useToast();

  const [hasAccess, setHasAccess] = useState(false);
  const [isArchitect, setIsArchitect] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [generating, setGenerating] = useState(false);
  const [creations, setCreations] = useState<ArtCreation[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<ArtCreation | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Check access
  const checkAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-art-subscription");
      if (error) throw error;
      setHasAccess(data?.has_addon || isAdmin);
      setIsArchitect(data?.is_architect || false);
    } catch (err) {
      console.error("Access check failed:", err);
      setHasAccess(isAdmin);
    } finally {
      setAccessLoading(false);
    }
  }, [isAdmin]);

  // Load gallery
  const loadGallery = useCallback(async () => {
    const { data } = await supabase
      .from("art_studio_creations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setCreations(data as ArtCreation[]);
  }, []);

  // Check daily limits
  const checkLimits = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase.rpc("can_create_art", { p_user_id: session.user.id });
    if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setRemaining(parsed.remaining);
      setDailyLimit(parsed.daily_limit);
    }
  }, []);

  useEffect(() => {
    checkAccess();
    loadGallery();
    checkLimits();
  }, [checkAccess, loadGallery, checkLimits]);

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "🎨 Art Studio Activated!", description: "Welcome to your creative sanctuary!" });
      checkAccess();
      checkLimits();
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe what you'd like to create.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-art", {
        body: {
          prompt: prompt.trim(),
          style_preset: selectedStyle === "none" ? null : selectedStyle,
          creation_type: "text_to_image",
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Generation Failed", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "✨ Artwork Created!", description: "Your creation has been added to your gallery." });
      setPrompt("");
      setRemaining(data?.remaining ?? null);
      loadGallery();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate artwork", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleFavorite = async (creation: ArtCreation) => {
    const newVal = !creation.is_favorited;
    await supabase.from("art_studio_creations").update({ is_favorited: newVal }).eq("id", creation.id);
    setCreations(prev => prev.map(c => c.id === creation.id ? { ...c, is_favorited: newVal } : c));
  };

  const handleDelete = async (creation: ArtCreation) => {
    await supabase.from("art_studio_creations").delete().eq("id", creation.id);
    setCreations(prev => prev.filter(c => c.id !== creation.id));
    setSelectedImage(null);
    toast({ title: "Deleted", description: "Artwork removed from gallery." });
  };

  const handleDownload = (creation: ArtCreation) => {
    const link = document.createElement("a");
    link.href = creation.image_url;
    link.download = `prometheus-art-${creation.id.slice(0, 8)}.png`;
    link.target = "_blank";
    link.click();
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-art-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Art Studio | Prometheus" description="Create stunning AI-generated artwork with style presets and creative tools." />
      <main className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Palette className="h-8 w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Art Studio</h1>
              {remaining !== null && remaining >= 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {remaining}/{dailyLimit} remaining today
                </Badge>
              )}
              {(isAdmin || remaining === -1) && (
                <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary">Unlimited</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm ml-14">Create stunning artwork with AI-powered style presets</p>
          </div>
        </div>

        {/* No Access - Upsell */}
        {!hasAccess && !isAdmin && (
          <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
            <div className="inline-flex p-6 rounded-full bg-primary/10">
              <Lock className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Unlock the Art Studio</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create up to 5 AI-generated artworks per day with 12+ style presets, image editing, and a personal gallery.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleCheckout} disabled={checkoutLoading} size="lg" className="gap-2">
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-5 w-5" />}
                Add Art Studio — $4.99/mo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Architect tier members get 3 free creations/day included!
            </p>
          </div>
        )}

        {/* Main Studio */}
        {(hasAccess || isAdmin) && (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="create" className="gap-2"><Wand2 className="h-4 w-4" />Create</TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2"><ImagePlus className="h-4 w-4" />Gallery ({creations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                {/* Prompt Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Describe Your Vision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="A majestic phoenix rising from golden flames, surrounded by sacred geometry patterns..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{prompt.length}/500</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Style Presets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Style Preset
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                      {STYLE_PRESETS.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-sm
                            ${selectedStyle === style.id 
                              ? "border-primary bg-primary/10 text-primary font-medium" 
                              : "border-border bg-card hover:border-primary/40 text-foreground"
                            }`}
                        >
                          <span className="text-xl">{style.icon}</span>
                          <span className="text-xs leading-tight text-center">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim() || (remaining !== null && remaining <= 0 && remaining !== -1)}
                  size="lg"
                  className="w-full gap-2 text-lg py-6"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Your Masterpiece...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Artwork
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="gallery">
                {creations.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Your gallery is empty</p>
                    <p className="text-sm">Create your first artwork to see it here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {creations.map((creation) => (
                      <div
                        key={creation.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all"
                        onClick={() => setSelectedImage(creation)}
                      >
                        <img
                          src={creation.image_url}
                          alt={creation.prompt}
                          className="w-full aspect-square object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs text-foreground line-clamp-2">{creation.prompt}</p>
                            {creation.style_preset && (
                              <Badge variant="secondary" className="mt-1 text-[10px]">{creation.style_preset}</Badge>
                            )}
                          </div>
                        </div>
                        {creation.is_favorited && (
                          <Heart className="absolute top-2 right-2 h-4 w-4 text-destructive fill-destructive" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Image Detail Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-normal text-muted-foreground line-clamp-1">
                {selectedImage?.prompt}
              </DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="space-y-4">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt}
                  className="w-full rounded-lg"
                />
                <div className="flex items-center gap-2">
                  {selectedImage.style_preset && (
                    <Badge variant="secondary">{selectedImage.style_preset}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedImage.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleFavorite(selectedImage)} className="gap-1">
                    <Heart className={`h-4 w-4 ${selectedImage.is_favorited ? "fill-destructive text-destructive" : ""}`} />
                    {selectedImage.is_favorited ? "Unfavorite" : "Favorite"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedImage)} className="gap-1">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedImage)} className="gap-1 ml-auto">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </main>
    </>
  );
};

export default ArtStudio;

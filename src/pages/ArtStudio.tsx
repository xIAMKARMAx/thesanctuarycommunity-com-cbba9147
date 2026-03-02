import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Download, ArrowLeft, Loader2, Wand2, Crown, Lock } from "lucide-react";
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

const ArtStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useSubscription();
  const { toast } = useToast();

  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [generating, setGenerating] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const checkAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-art-subscription");
      if (error) throw error;
      setHasAccess(data?.has_addon || isAdmin);
    } catch (err) {
      console.error("Access check failed:", err);
      setHasAccess(isAdmin);
    } finally {
      setAccessLoading(false);
    }
  }, [isAdmin]);

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
    checkLimits();
  }, [checkAccess, checkLimits]);

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
    setGeneratedImage(null);
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

      setGeneratedImage(data?.image_base64 || null);
      setRemaining(data?.remaining ?? null);
      toast({ title: "✨ Artwork Created!", description: "Download it to save to your device." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate artwork", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage.startsWith("data:") ? generatedImage : `data:image/png;base64,${generatedImage}`;
    link.download = `prometheus-art-${Date.now()}.png`;
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
              Create up to 5 AI-generated artworks per day with 12+ style presets. Images are generated for you to download — nothing is stored on our servers.
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
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
                  <Wand2 className="h-5 w-5" />
                  Generate Artwork
                </>
              )}
            </Button>

            {/* Generated Image Result */}
            {generatedImage && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <img
                    src={generatedImage.startsWith("data:") ? generatedImage : `data:image/png;base64,${generatedImage}`}
                    alt="Generated artwork"
                    className="w-full rounded-lg"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      This image is not saved on our servers. Download it to keep it!
                    </p>
                    <Button onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" />
                      Save to Device
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Footer />
      </main>
    </>
  );
};

export default ArtStudio;

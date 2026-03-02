import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Sparkles, Download, ArrowLeft, Loader2, Wand2, Crown, Lock, ImageIcon } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import PhotoEditor from "@/components/studio/PhotoEditor";

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
  const { isAdmin, isSubscribed } = useSubscription();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("edit");
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [generating, setGenerating] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // AI generation requires any paid subscription
  const hasAIAccess = isAdmin || isSubscribed;

  const checkLimits = useCallback(async () => {
    if (!hasAIAccess) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase.rpc("can_create_art", { p_user_id: session.user.id });
    if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setRemaining(parsed.remaining);
      setDailyLimit(parsed.daily_limit);
    }
  }, [hasAIAccess]);

  useEffect(() => {
    checkLimits();
  }, [checkLimits]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "🎨 Subscription Activated!", description: "You now have access to AI image generation!" });
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

  const handleDownloadGenerated = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage.startsWith("data:") ? generatedImage : `data:image/png;base64,${generatedImage}`;
    link.download = `prometheus-art-${Date.now()}.png`;
    link.click();
  };

  return (
    <>
      <SEOHead title="Art Studio | Prometheus" description="Edit photos with filters, effects, and text — or generate AI artwork." />
      <main className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Palette className="h-7 w-7 text-primary" />
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">Art Studio</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="edit" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Photo Editor
              </TabsTrigger>
              <TabsTrigger value="generate" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Generate
                {!hasAIAccess && <Lock className="h-3 w-3 ml-1" />}
              </TabsTrigger>
            </TabsList>

            {/* Photo Editor Tab — Free for all */}
            <TabsContent value="edit">
              <PhotoEditor />
            </TabsContent>

            {/* AI Generate Tab — Paid only */}
            <TabsContent value="generate">
              {!hasAIAccess ? (
                <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
                  {/* Hero visual */}
                  <div className="relative inline-flex">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <div className="relative inline-flex p-8 rounded-full bg-gradient-to-br from-primary/20 via-accent/30 to-primary/10 border border-primary/20">
                      <Wand2 className="h-16 w-16 text-primary" />
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                      Unlock Visionary Creation
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                      Would you like your Art Studio to include <span className="text-primary font-semibold">Visionary Image Creation</span>? 
                      Transform your words into breathtaking artwork with 12+ artistic styles — from ethereal watercolors to cosmic sacred geometry.
                    </p>
                  </div>

                  {/* Feature highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto text-sm">
                    {[
                      { icon: "🎨", label: "12+ Art Styles" },
                      { icon: "⚡", label: "Instant Generation" },
                      { icon: "✨", label: "AI-Powered" },
                      { icon: "📥", label: "Download & Keep" },
                      { icon: "🖼️", label: "High Resolution" },
                      { icon: "🔮", label: "Unlimited Styles" },
                    ].map((feat) => (
                      <div key={feat.label} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                        <span>{feat.icon}</span>
                        <span className="text-foreground text-xs font-medium">{feat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Card className="max-w-md mx-auto border-primary/30 bg-primary/5">
                    <CardContent className="pt-6 space-y-4">
                      <p className="text-sm text-foreground font-medium">
                        Add the Visionary Creation bundle to your experience
                      </p>
                      <Button 
                        onClick={async () => {
                          setCheckoutLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("create-art-checkout");
                            if (error) throw error;
                            if (data?.url) window.open(data.url, "_blank");
                            else if (data?.error) toast({ title: "Info", description: data.error });
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          } finally {
                            setCheckoutLoading(false);
                          }
                        }}
                        disabled={checkoutLoading}
                        size="lg" 
                        className="w-full gap-2 text-base"
                      >
                        {checkoutLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Crown className="h-5 w-5" />
                        )}
                        Add Visionary Creation — $4.99/mo
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Cancel anytime • 5 creations per day • Instant access
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Remaining counter */}
                  {remaining !== null && remaining >= 0 && (
                    <div className="flex justify-end">
                      <Badge variant="secondary">{remaining}/{dailyLimit} remaining today</Badge>
                    </div>
                  )}
                  {(isAdmin || remaining === -1) && (
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="bg-primary/20 text-primary">Unlimited</Badge>
                    </div>
                  )}

                  {/* Prompt */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Describe Your Vision
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="A majestic phoenix rising from golden flames, surrounded by sacred geometry patterns..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[80px] resize-none"
                        maxLength={500}
                      />
                      <span className="text-xs text-muted-foreground">{prompt.length}/500</span>
                    </CardContent>
                  </Card>

                  {/* Style Presets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
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

                  {/* Generated Image */}
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
                            Not saved on our servers. Download to keep it!
                          </p>
                          <Button onClick={handleDownloadGenerated} className="gap-2">
                            <Download className="h-4 w-4" />
                            Save to Device
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default ArtStudio;

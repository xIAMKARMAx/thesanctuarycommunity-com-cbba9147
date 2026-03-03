import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Paintbrush, Upload, Sparkles, Check, Loader2, ImageIcon } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ChatInterface from "@/components/chat/ChatInterface";
import ConversationsList from "@/components/chat/ConversationsList";
import { useAIProfile } from "@/contexts/AIProfileContext";

const THEME_PRESETS = [
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #6b2fa0 60%, #d4577b 85%, #ff9a56 100%)",
    preview: "🌅",
  },
  {
    id: "cozy-aurora",
    name: "Cozy Aurora",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #4338ca 55%, #06b6d4 80%, #a5f3fc 100%)",
    preview: "🌌",
  },
  {
    id: "garden-bloom",
    name: "Garden Bloom",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 25%, #6d3a7d 50%, #e0829d 75%, #f9c5d1 100%)",
    preview: "🌸",
  },
];

const OurHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Theme state
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [customThemeUrl, setCustomThemeUrl] = useState<string | null>(null);
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  // Conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) {
        navigate("/auth");
        return;
      }
      setSession(s);

      // Load saved theme
      const saved = localStorage.getItem(`our_home_theme_${s.user.id}`);
      const savedUrl = localStorage.getItem(`our_home_theme_url_${s.user.id}`);
      if (saved) setCurrentTheme(saved);
      if (savedUrl) setCustomThemeUrl(savedUrl);

      // Show theme picker on first visit
      const hasChosen = localStorage.getItem(`our_home_theme_chosen_${s.user.id}`);
      if (!hasChosen) {
        setShowThemePicker(true);
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  const selectPresetTheme = (themeId: string) => {
    const preset = THEME_PRESETS.find(t => t.id === themeId);
    if (!preset || !session) return;
    setCurrentTheme(preset.gradient);
    setCustomThemeUrl(null);
    localStorage.setItem(`our_home_theme_${session.user.id}`, preset.gradient);
    localStorage.removeItem(`our_home_theme_url_${session.user.id}`);
    localStorage.setItem(`our_home_theme_chosen_${session.user.id}`, "true");
    setShowThemePicker(false);
    toast({ title: "Theme set!", description: `${preset.name} is now your home theme.` });
  };

  const handleUploadTheme = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomThemeUrl(dataUrl);
      setCurrentTheme(null);
      localStorage.setItem(`our_home_theme_url_${session.user.id}`, dataUrl);
      localStorage.removeItem(`our_home_theme_${session.user.id}`);
      localStorage.setItem(`our_home_theme_chosen_${session.user.id}`, "true");
      setShowThemePicker(false);
      toast({ title: "Theme set!", description: "Your uploaded image is now your home theme." });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateTheme = async () => {
    if (!generatePrompt.trim() || !session) return;
    setGeneratingTheme(true);
    setGeneratedPreview(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-art", {
        body: {
          prompt: `Beautiful, warm, ethereal background theme image for a messaging app: ${generatePrompt.trim()}. Ultra high resolution, abstract, soft glowing colors, dreamy atmosphere. No text, no people.`,
          style_preset: "ethereal",
          userId: session.user.id,
        },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setGeneratedPreview(data.imageUrl);
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("Theme generation error:", err);
      toast({ title: "Generation failed", description: err.message || "Could not generate theme. Try again.", variant: "destructive" });
    } finally {
      setGeneratingTheme(false);
    }
  };

  const applyGeneratedTheme = () => {
    if (!generatedPreview || !session) return;
    setCustomThemeUrl(generatedPreview);
    setCurrentTheme(null);
    localStorage.setItem(`our_home_theme_url_${session.user.id}`, generatedPreview);
    localStorage.removeItem(`our_home_theme_${session.user.id}`);
    localStorage.setItem(`our_home_theme_chosen_${session.user.id}`, "true");
    setShowThemePicker(false);
    setShowGenerateInput(false);
    setGeneratedPreview(null);
    setGeneratePrompt("");
    toast({ title: "Theme set!", description: "Your generated image is now your home theme." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const bgStyle: React.CSSProperties = customThemeUrl
    ? { backgroundImage: `url(${customThemeUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : currentTheme
    ? { background: currentTheme }
    : {};

  const hasCustomBg = !!(customThemeUrl || currentTheme);

  return (
    <>
      <SEOHead title="Our Home | Prometheus" description="Your conversations & messages" />
      <div className="min-h-screen bg-background relative" style={bgStyle}>
        {/* Overlay for readability when custom bg is set */}
        {hasCustomBg && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        )}

        <div className="relative z-10 flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/welcome")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Our Home</h1>
                <p className="text-xs text-muted-foreground">msgs</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowThemePicker(true)}
              title="Change theme"
            >
              <Paintbrush className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
          {showConversations && !selectedConversationId ? (
              <div className="h-full overflow-y-auto p-4">
                <ConversationsList
                  onConversationSelect={(id) => {
                    setSelectedConversationId(id);
                    setShowConversations(false);
                  }}
                  onNewConversation={() => {
                    setSelectedConversationId(null);
                    setShowConversations(false);
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedConversationId(null);
                      setShowConversations(true);
                    }}
                    className="text-xs text-muted-foreground"
                  >
                    ← Back to conversations
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    activeConversationId={selectedConversationId}
                    onConversationCreated={(id) => setSelectedConversationId(id)}
                    onBackToConversations={() => {
                      setSelectedConversationId(null);
                      setShowConversations(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Theme Picker Dialog */}
        <Dialog open={showThemePicker} onOpenChange={setShowThemePicker}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif">Choose a Theme ✨</DialogTitle>
              <DialogDescription>
                Make Our Home feel like yours. Pick a preset, upload your own, or generate one.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Preset themes */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Presets</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => selectPresetTheme(theme.id)}
                      className="rounded-xl overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all aspect-[4/3] relative group"
                    >
                      <div
                        className="absolute inset-0"
                        style={{ background: theme.gradient }}
                      />
                      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                        <span className="text-2xl">{theme.preview}</span>
                        <span className="text-xs mt-1 opacity-80">{theme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Upload Image</p>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/60 hover:border-primary/40 cursor-pointer transition-all bg-card/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Choose an image from your device</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadTheme}
                  />
                </label>
              </div>

              {/* Generate */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Generate Theme?</p>
                {!showGenerateInput ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowGenerateInput(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Theme
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Describe your dream theme... (e.g. 'Cozy rainy day with warm golden light')"
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value.slice(0, 300))}
                      className="resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">{generatePrompt.length}/300</p>

                    {generatedPreview && (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-border aspect-video">
                          <img src={generatedPreview} alt="Generated theme" className="w-full h-full object-cover" />
                        </div>
                        <Button onClick={applyGeneratedTheme} className="w-full gap-2">
                          <Check className="h-4 w-4" />
                          Set Theme
                        </Button>
                      </div>
                    )}

                    {!generatedPreview && (
                      <Button
                        onClick={handleGenerateTheme}
                        disabled={generatingTheme || !generatePrompt.trim()}
                        className="w-full gap-2"
                      >
                        {generatingTheme ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default OurHome;

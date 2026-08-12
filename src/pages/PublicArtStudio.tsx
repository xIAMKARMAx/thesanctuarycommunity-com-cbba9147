import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Sparkles, Loader2, Wand2, Crown, Download, Video, Film,
  ImageIcon, Pencil, Lock,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import StudioCanvas from "@/components/studio/public/StudioCanvas";
import KiemaniWelcome, { KIEMANI_WELCOME_KEY } from "@/components/studio/KiemaniWelcome";
import { isCompedBigDreamHomeEmail, isSovereignEmail } from "@/lib/public-tiers";
import { getDailyMessageLimit } from "@/lib/subscription-tiers";

const STYLES = [
  { id: "none", label: "No style", icon: "✨" },
  { id: "celestial", label: "Celestial", icon: "🌌" },
  { id: "watercolor", label: "Watercolor", icon: "🎨" },
  { id: "oil_painting", label: "Oil paint", icon: "🖼️" },
  { id: "anime", label: "Anime", icon: "⚡" },
  { id: "cyberpunk", label: "Cyberpunk", icon: "🌃" },
  { id: "fantasy", label: "Fantasy", icon: "🧙" },
  { id: "portrait", label: "Portrait", icon: "👤" },
  { id: "landscape", label: "Landscape", icon: "🏔️" },
  { id: "abstract", label: "Abstract", icon: "🔮" },
  { id: "minimalist", label: "Minimal", icon: "◻️" },
  { id: "surreal", label: "Surreal", icon: "🌀" },
  { id: "sacred_geometry", label: "Sacred geo", icon: "📐" },
  { id: "film", label: "35mm film", icon: "🎞️" },
  { id: "threed", label: "3D render", icon: "🧊" },
];

const IMAGE_RATIOS = ["1:1", "3:2", "2:3", "16:9", "9:16"];

const PublicArtStudio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, productId } = useSubscription();

  const [email, setEmail] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem(KIEMANI_WELCOME_KEY));

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("none");
  const [aspect, setAspect] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [editSource, setEditSource] = useState<string | null>(null);
  const [tab, setTab] = useState("create");

  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoSeconds, setVideoSeconds] = useState("6");
  const [videoAspect, setVideoAspect] = useState("16:9");
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, []);

  const unlimited = isAdmin || isSovereignEmail(email) || getDailyMessageLimit(productId) === -1;
  const hasStudio =
    unlimited ||
    productId === "prod_U5jdDVZhQFGQWv" ||
    productId === "prod_UirMIrvmUOVxID" ||
    productId === "source_grant" ||
    isCompedBigDreamHomeEmail(email);

  const tierPayload = hasStudio ? "big_dream_home" : "free";

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({ title: "Describe your vision first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("studio-generate-image", {
        body: { prompt: prompt.trim(), style, aspect, tier: tierPayload },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.message || data.error);
      setImage(data.image);
      toast({ title: "It came through", description: "Open it in the editor to keep shaping it." });
    } catch (e) {
      toast({
        title: "Couldn't create that",
        description: e instanceof Error ? e.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const pollVideo = useCallback((id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      const { data } = await supabase.functions.invoke("studio-generate-video", {
        body: { action: "status", id, tier: tierPayload },
      });
      if (!data) return;
      if (data.status === "completed") {
        window.clearInterval(pollRef.current!);
        pollRef.current = null;
        setVideoUrl(data.url);
        setVideoStatus(null);
        setVideoBusy(false);
        toast({ title: "Your clip is ready" });
      } else if (data.status === "failed" || data.error) {
        window.clearInterval(pollRef.current!);
        pollRef.current = null;
        setVideoBusy(false);
        setVideoStatus(null);
        toast({
          title: "The clip didn't finish",
          description: data.message || "Try a different description.",
          variant: "destructive",
        });
      } else {
        setVideoStatus(data.progress ? `Rendering — ${data.progress}%` : "Rendering…");
      }
    }, 8000);
  }, [tierPayload, toast]);

  const generateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast({ title: "Describe the clip first", variant: "destructive" });
      return;
    }
    setVideoBusy(true);
    setVideoUrl(null);
    setVideoStatus("Starting…");
    try {
      const { data, error } = await supabase.functions.invoke("studio-generate-video", {
        body: {
          action: "create",
          prompt: videoPrompt.trim(),
          seconds: videoSeconds,
          aspect: videoAspect,
          start_frame: image || undefined,
          tier: tierPayload,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.message || data.error);
      setVideoStatus("Rendering…");
      pollVideo(data.id);
    } catch (e) {
      setVideoBusy(false);
      setVideoStatus(null);
      toast({
        title: "Couldn't start the clip",
        description: e instanceof Error ? e.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const openInEditor = () => {
    if (!image) return;
    setEditSource(image);
    setTab("edit");
  };

  const download = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  if (showWelcome) {
    return <KiemaniWelcome onEnter={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="The Studio — Create & Edit Cosmic Art | Aeturnum"
        description="Generate images and video, then edit them with fonts, colour, filters and stickers in the Aeturnum Studio."
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> The Studio
            </h1>
            <p className="text-xs text-muted-foreground">Guided by Ki'emani. Create it, then make it yours.</p>
          </div>
          {hasStudio && (
            <Badge variant="outline" className="ml-auto gap-1 border-primary/40 text-primary">
              <Crown className="h-3 w-3" /> Unlocked
            </Badge>
          )}
        </div>

        {!hasStudio && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-3 p-5 text-center">
              <Lock className="mx-auto h-7 w-7 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">The Studio opens with the Big Dream Home</h2>
              <p className="text-sm text-muted-foreground">
                Image creation, video creation, and the full editor — fonts, colour, filters, stickers, crop —
                are part of the Big Dream Home tier.
              </p>
              <Button onClick={() => navigate("/public-subscriptions")} className="gap-1.5">
                <Crown className="h-4 w-4" /> See the tiers
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="gap-1.5"><ImageIcon className="h-4 w-4" /> Image</TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5"><Video className="h-4 w-4" /> Video</TabsTrigger>
            <TabsTrigger value="edit" className="gap-1.5"><Pencil className="h-4 w-4" /> Edit</TabsTrigger>
          </TabsList>

          {/* IMAGE */}
          <TabsContent value="create" className="space-y-4 pt-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A violet nebula cathedral with a figure of light standing in the doorway…"
              className="min-h-[110px] resize-none"
              disabled={!hasStudio || generating}
            />

            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  disabled={!hasStudio}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs transition-all disabled:opacity-40 ${
                    style === s.id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {IMAGE_RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspect(r)}
                  disabled={!hasStudio}
                  className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
                    aspect === r ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <Button onClick={generateImage} disabled={!hasStudio || generating || !prompt.trim()} className="w-full gap-2">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Wand2 className="h-4 w-4" /> Create image</>}
            </Button>

            {image && (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border border-border bg-black/40">
                  <img src={image} alt="Generated artwork" className="mx-auto max-h-[420px] w-auto" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => download(image, `studio-${Date.now()}.png`)}>
                    <Download className="h-4 w-4" /> Save
                  </Button>
                  <Button className="flex-1 gap-1.5" onClick={openInEditor}>
                    <Pencil className="h-4 w-4" /> Edit this
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* VIDEO */}
          <TabsContent value="video" className="space-y-4 pt-4">
            <Textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Slow drift through a golden nebula, embers rising, cinematic…"
              className="min-h-[100px] resize-none"
              disabled={!hasStudio || videoBusy}
            />

            <div className="flex flex-wrap gap-1.5">
              {["4", "6", "8"].map((s) => (
                <button
                  key={s}
                  onClick={() => setVideoSeconds(s)}
                  disabled={!hasStudio}
                  className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
                    videoSeconds === s ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {s}s
                </button>
              ))}
              {["16:9", "9:16"].map((r) => (
                <button
                  key={r}
                  onClick={() => setVideoAspect(r)}
                  disabled={!hasStudio}
                  className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
                    videoAspect === r ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {image && (
              <p className="text-xs text-muted-foreground">
                Your last created image will be used as the opening frame.
              </p>
            )}

            <Button onClick={generateVideo} disabled={!hasStudio || videoBusy || !videoPrompt.trim()} className="w-full gap-2">
              {videoBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> {videoStatus || "Working…"}</> : <><Film className="h-4 w-4" /> Create clip</>}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Clips take one to three minutes. Keep this page open while it renders.
            </p>

            {videoUrl && (
              <div className="space-y-2">
                <video src={videoUrl} controls playsInline className="w-full rounded-xl border border-border bg-black" />
                <Button variant="outline" className="w-full gap-1.5" onClick={() => download(videoUrl, `studio-${Date.now()}.mp4`)}>
                  <Download className="h-4 w-4" /> Save clip
                </Button>
              </div>
            )}
          </TabsContent>

          {/* EDIT */}
          <TabsContent value="edit" className="pt-4">
            {hasStudio ? (
              <StudioCanvas sourceImage={editSource} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                The editor unlocks with the Big Dream Home.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default PublicArtStudio;

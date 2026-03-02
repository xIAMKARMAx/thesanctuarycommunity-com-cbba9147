import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Video, Upload, X, Download, Sparkles, Film } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const VideoStudio = () => {
  const navigate = useNavigate();
  const { isAdmin } = useSubscription();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [model, setModel] = useState("ray-2");
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Admin-only gate
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Video className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-serif font-bold text-foreground">Admin Access Only</h2>
            <p className="text-muted-foreground">Video generation is currently restricted to admin accounts.</p>
            <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImageForLuma = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const ext = imageFile.name.split(".").pop() || "png";
    const path = `video-refs/${session.user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("chat-images")
      .upload(path, imageFile, { contentType: imageFile.type });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe what video you'd like to create.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setVideoUrl(null);
    setThumbnailUrl(null);
    setEnhancedPrompt(null);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImageForLuma();
        if (!imageUrl) {
          toast({ title: "Upload failed", description: "Couldn't upload reference image.", variant: "destructive" });
          setGenerating(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          prompt: prompt.trim(),
          image_url: imageUrl,
          model,
          aspect_ratio: aspectRatio,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: "Generation Failed", description: data.error, variant: "destructive" });
        return;
      }

      if (data?.video_url) {
        setVideoUrl(data.video_url);
        setThumbnailUrl(data.thumbnail_url || null);
        setEnhancedPrompt(data.enhanced_prompt || null);
        toast({ title: "🎬 Video Created!", description: "Your video is ready to view and download." });
        toast({ title: "🎬 Video Created!", description: "Your video is ready to view and download." });
      } else if (data?.generation_id) {
        toast({ title: "Still Processing", description: "Video is taking longer than usual. Try again shortly." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate video", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const resp = await fetch(videoUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prometheus-video-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(videoUrl, "_blank");
    }
  };

  return (
    <>
      <SEOHead title="Video Studio | Prometheus" description="Generate AI-powered videos from text or images." />
      <main className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Film className="h-7 w-7 text-primary" />
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">Video Studio</h1>
              <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">Admin</Badge>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                Describe Your Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="A cinematic drone shot flying over a misty mountain range at sunrise, golden light streaming through clouds..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />
              <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
            </CardContent>
          </Card>

          {/* Reference Image (optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-5 w-5 text-primary" />
                Reference Image
                <span className="text-xs text-muted-foreground font-normal">(optional — enables image-to-video)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Reference" className="max-h-48 rounded-lg border border-border" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={clearImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Model</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ray-2">Ray 2 (Quality — Default)</SelectItem>
                    <SelectItem value="ray-flash-2">Ray Flash 2 (Fast)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aspect Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                    <SelectItem value="3:4">3:4 (Portrait Classic)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            size="lg"
            className="w-full gap-2 text-lg py-6"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Video... (up to 3 min)
              </>
            ) : (
              <>
                <Video className="h-5 w-5" />
                {imagePreview ? "Generate Video from Image" : "Generate Video"}
              </>
            )}
          </Button>

          {/* Result */}
          {videoUrl && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {enhancedPrompt && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground font-medium mb-1">✨ AI-Enhanced Prompt</p>
                    <p className="text-sm text-foreground">{enhancedPrompt}</p>
                  </div>
                )}
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg"
                  poster={thumbnailUrl || undefined}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Video hosted temporarily by Luma AI</p>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Save to Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
};

export default VideoStudio;

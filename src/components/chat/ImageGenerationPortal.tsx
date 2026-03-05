import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Download, MessageSquarePlus, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

interface ImageGenerationPortalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToConversation?: (imageBase64: string) => void;
}

export function ImageGenerationPortal({ open, onOpenChange, onAddToConversation }: ImageGenerationPortalProps) {
  const { toast } = useToast();
  const { canGenerateImage, isSubscribed, isAdmin } = useSubscription();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Describe your vision", description: "Enter a description for your image", variant: "destructive" });
      return;
    }

    // All users need to check limits (except admin)
    if (!isAdmin) {
      const canGenerate = await canGenerateImage();
      if (!canGenerate) {
        toast({ title: "Daily limit reached", description: "You've reached your image generation limit for today.", variant: "destructive" });
        return;
      }
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: `[generate image: ${prompt.trim()}]`,
          conversationId: "image-portal-standalone",
          generateImage: true,
          userId: user.id,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({ title: "Image manifested!", description: "Your vision has been brought to life" });

        // Increment count for all non-admin users
        if (!isAdmin) {
          await supabase.rpc("increment_image_count", { p_user_id: user.id });
        }
      } else {
        throw new Error("No image was generated");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      toast({ title: "Generation failed", description: err.message || "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddToConversation = () => {
    if (generatedImage && onAddToConversation) {
      onAddToConversation(generatedImage);
      toast({ title: "Image added", description: "The image has been shared in your conversation" });
      handleClose();
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setPrompt("");
    setGeneratedImage(null);
    setReferenceImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Image Generation Portal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Describe your image</label>
            <Textarea
              placeholder="A ethereal sunset over crystal mountains with aurora lights..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Reference Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Reference image (optional)</label>
            {referenceImage ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                <button onClick={() => setReferenceImage(null)} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={isGenerating}>
                <Upload className="h-4 w-4" /> Upload reference
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Manifesting your vision...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>

          {/* Generated Image Result */}
          {generatedImage && (
            <div className="space-y-3 animate-in fade-in-50">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={generatedImage} alt="Generated" className="w-full h-auto max-h-80 object-contain bg-muted" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownload} className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> Save
                </Button>
                {onAddToConversation && (
                  <Button onClick={handleAddToConversation} className="flex-1 gap-2">
                    <MessageSquarePlus className="h-4 w-4" /> Add to Chat
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

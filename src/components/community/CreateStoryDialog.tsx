import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (mediaUrl: string, mediaType: string, caption?: string) => Promise<any>;
}

export function CreateStoryDialog({ open, onOpenChange, onCreate }: CreateStoryDialogProps) {
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const isValid = f.type.startsWith("image/") || f.type.startsWith("video/");
    if (!isValid) {
      toast({ title: "Please select an image or video", variant: "destructive" });
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast({ title: "File too large (max 20MB)", variant: "destructive" });
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `stories/${session.session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("community-media").getPublicUrl(path);

      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      await onCreate(publicUrl, mediaType, caption || undefined);

      setCaption("");
      setPreview(null);
      setFile(null);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCaption("");
      setPreview(null);
      setFile(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Share a Moment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
              <Camera className="h-10 w-10 text-primary/40 mb-3" />
              <span className="text-sm text-muted-foreground">Tap to add a photo or video</span>
              <span className="text-xs text-muted-foreground/60 mt-1">Disappears after 24 hours</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black">
              {file?.type.startsWith("video/") ? (
                <video src={preview} className="w-full h-64 object-contain" controls />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-64 object-contain" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 text-white bg-black/40 hover:bg-black/60 h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Caption (optional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your soul..."
              maxLength={200}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!file || uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <>Sharing...</>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Share Moment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

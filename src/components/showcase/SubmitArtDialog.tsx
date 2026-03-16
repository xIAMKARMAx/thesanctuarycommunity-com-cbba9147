import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubmitArtDialogProps {
  onSubmit: (title: string, description: string, imageUrl: string) => Promise<any>;
}

export function SubmitArtDialog({ onSubmit }: SubmitArtDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop();
      const fileName = `${session.session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !imageUrl) {
      toast({ title: "Missing Info", description: "Title and image are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const result = await onSubmit(title.trim(), description.trim(), imageUrl);
    setSubmitting(false);

    if (result) {
      setTitle("");
      setDescription("");
      setImageUrl("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Submit Art
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit to Ki'emani's Showcase</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="art-title">Title *</Label>
            <Input
              id="art-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your creation..."
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="art-desc">Description</Label>
            <Textarea
              id="art-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this piece..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div>
            <Label>Image *</Label>
            {imageUrl ? (
              <div className="relative mt-2">
                <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-border" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl("")}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload image (max 5MB)</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !imageUrl}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

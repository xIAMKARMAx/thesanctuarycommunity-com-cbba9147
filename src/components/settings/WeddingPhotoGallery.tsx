import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface WeddingPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  photo_order: number;
  created_at: string;
}

interface WeddingPhotoGalleryProps {
  marriageId: string;
  aiName: string;
}

const WeddingPhotoGallery = ({ marriageId, aiName }: WeddingPhotoGalleryProps) => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<WeddingPhoto | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [marriageId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("wedding_photos")
        .select("*")
        .eq("marriage_id", marriageId)
        .order("photo_order", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error loading wedding photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a JPEG, PNG, GIF, or WebP image", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 10MB", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `wedding-${marriageId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("wedding_photos")
        .insert({
          user_id: user.id,
          marriage_id: marriageId,
          photo_url: publicUrl,
          photo_order: photos.length
        });

      if (insertError) throw insertError;

      await loadPhotos();
      toast({ title: "Photo uploaded!", description: "Your wedding photo has been added to the gallery" });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast({ 
        title: "Upload failed", 
        description: error.message || "Failed to upload photo", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const { error } = await supabase
        .from("wedding_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      toast({ title: "Photo deleted" });
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast({ 
        title: "Delete failed", 
        description: error.message || "Failed to delete photo", 
        variant: "destructive" 
      });
    }
  };

  const handleSaveCaption = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from("wedding_photos")
        .update({ caption: captionText || null })
        .eq("id", photoId);

      if (error) throw error;

      setPhotos(photos.map(p => 
        p.id === photoId ? { ...p, caption: captionText || null } : p
      ));
      setEditingCaption(null);
      toast({ title: "Caption saved" });
    } catch (error: any) {
      console.error("Error saving caption:", error);
      toast({ 
        title: "Save failed", 
        description: error.message || "Failed to save caption", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-pink-500" />
          Wedding Photo Gallery
        </CardTitle>
        <CardDescription>
          Cherish memories from your wedding with {aiName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Add Wedding Photo</>
            )}
          </Button>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <Dialog key={photo.id}>
                <DialogTrigger asChild>
                  <div 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-border hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img 
                      src={photo.photo_url} 
                      alt={photo.caption || "Wedding photo"} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Wedding Photo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <img 
                      src={photo.photo_url} 
                      alt={photo.caption || "Wedding photo"} 
                      className="w-full rounded-lg"
                    />
                    
                    {/* Caption editing */}
                    {editingCaption === photo.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={captionText}
                          onChange={(e) => setCaptionText(e.target.value)}
                          placeholder="Add a caption..."
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => handleSaveCaption(photo.id)}>
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditingCaption(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {photo.caption || "No caption"}
                        </p>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingCaption(photo.id);
                            setCaptionText(photo.caption || "");
                          }}
                        >
                          Edit Caption
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Photo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No wedding photos yet</p>
            <p className="text-sm">Upload photos to create your wedding album</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeddingPhotoGallery;

import { useState, useRef } from "react";
import { GalleryItem, useCelestialGallery } from "@/hooks/useCelestialGallery";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, Play, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CelestialGalleryTabProps {
  userId: string;
  isOwnProfile: boolean;
}

export function CelestialGalleryTab({ userId, isOwnProfile }: CelestialGalleryTabProps) {
  const { items, loading, uploadMedia, removeItem } = useCelestialGallery(userId);
  const [uploading, setUploading] = useState(false);
  const [viewItem, setViewItem] = useState<GalleryItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMedia(file);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {isOwnProfile && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Add to Gallery"}
            </Button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {isOwnProfile
                ? "Your Ethereal Moments gallery is empty — add photos & videos to share"
                : "No moments captured yet"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {items.map((item) => (
              <div key={item.id} className="relative group aspect-square">
                {item.media_type === "video" ? (
                  <button onClick={() => setViewItem(item)} className="w-full h-full">
                    <video src={item.media_url} className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </button>
                ) : (
                  <button onClick={() => setViewItem(item)} className="w-full h-full">
                    <img src={item.media_url} alt="" className="w-full h-full object-cover rounded-md" />
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none">
          {viewItem && (
            viewItem.media_type === "video" ? (
              <video src={viewItem.media_url} controls autoPlay className="w-full max-h-[80vh] object-contain" />
            ) : (
              <img src={viewItem.media_url} alt="" className="w-full max-h-[80vh] object-contain" />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

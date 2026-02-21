import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Video, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaUploadProps {
  onMediaSelect: (url: string, type: 'image' | 'video') => void;
  onClear: () => void;
  currentMedia?: { url: string; type: 'image' | 'video' }[] | null;
  onRemoveMedia?: (index: number) => void;
  disabled?: boolean;
  maxImages?: number;
  currentImageCount?: number;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION = 240;

export function MediaUpload({ onMediaSelect, onClear, currentMedia, onRemoveMedia, disabled, maxImages = 5, currentImageCount = 0 }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(`Video must be ${MAX_VIDEO_DURATION / 60} minutes or less`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        toast.error("Invalid video file");
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const uploadMedia = useCallback(async (file: File, type: 'image' | 'video') => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload media");
        return;
      }

      const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        toast.error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
        return;
      }

      if (type === 'video') {
        const isValid = await validateVideo(file);
        if (!isValid) return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setUploadProgress(30);

      const { data, error } = await supabase.storage
        .from('community-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(80);

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      onMediaSelect(urlData.publicUrl, type);
      toast.success(`${type === 'video' ? 'Video' : 'Photo'} ready to share!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload media");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onMediaSelect]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'image') {
      const remaining = maxImages - currentImageCount;
      const filesToUpload = Array.from(files).slice(0, remaining);
      if (files.length > remaining) {
        toast.error(`You can only add ${remaining} more photo${remaining !== 1 ? 's' : ''} (max ${maxImages})`);
      }
      for (const file of filesToUpload) {
        await uploadMedia(file, 'image');
      }
    } else {
      await uploadMedia(files[0], 'video');
    }
    e.target.value = '';
  }, [uploadMedia, maxImages, currentImageCount]);

  // Preview mode - show current media
  if (currentMedia && currentMedia.length > 0) {
    return (
      <div className="space-y-2">
        <div className={`grid gap-2 ${currentMedia.length === 1 ? 'grid-cols-1' : currentMedia.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {currentMedia.map((item, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30">
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  controls
                  className="w-full max-h-48 object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 sm:h-48 object-cover"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => onRemoveMedia?.(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        {/* Allow adding more if under limit */}
        {currentImageCount < maxImages && !currentMedia.some(m => m.type === 'video') && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e, 'image')}
              disabled={disabled}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Image className="h-3 w-3" />
              Add more ({currentImageCount}/{maxImages})
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isUploading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading... {uploadProgress}%</span>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, 'image')}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Image className="h-4 w-4" />
          </Button>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'video')}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => videoInputRef.current?.click()}
            disabled={disabled}
            title="Max 4 minutes, 50MB"
          >
            <Video className="h-4 w-4" />
          </Button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'image')}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

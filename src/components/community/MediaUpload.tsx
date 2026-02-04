import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Video, X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaUploadProps {
  onMediaSelect: (url: string, type: 'image' | 'video') => void;
  onClear: () => void;
  currentMedia?: { url: string; type: 'image' | 'video' } | null;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 240; // 4 minutes in seconds

export function MediaUpload({ onMediaSelect, onClear, currentMedia, disabled }: MediaUploadProps) {
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

      // Validate size
      const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        toast.error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
        return;
      }

      // Validate video duration
      if (type === 'video') {
        const isValid = await validateVideo(file);
        if (!isValid) return;
      }

      // Generate unique filename
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
    const file = e.target.files?.[0];
    if (file) {
      await uploadMedia(file, type);
    }
    e.target.value = '';
  }, [uploadMedia]);

  if (currentMedia) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30">
        {currentMedia.type === 'video' ? (
          <video
            src={currentMedia.url}
            controls
            className="w-full max-h-64 object-contain"
          />
        ) : (
          <img
            src={currentMedia.url}
            alt="Preview"
            className="w-full max-h-64 object-contain"
          />
        )}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
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
          {/* Photo Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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

          {/* Video Upload */}
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

          {/* Camera Capture */}
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

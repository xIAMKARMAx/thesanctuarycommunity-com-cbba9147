import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Image as ImageIcon, Radio, Trash2 } from "lucide-react";
import { useProfileEchoes } from "@/hooks/useProfileEchoes";
import { EchoCard } from "./EchoCard";
import { MentionTextarea, MentionTextareaRef } from "./MentionTextarea";
import { supabase } from "@/integrations/supabase/client";

interface EchoesTabProps {
  profileUserId: string;
  currentUserId?: string;
  isOwnProfile: boolean;
  onProfileClick: (userId: string) => void;
}

export function EchoesTab({ profileUserId, currentUserId, isOwnProfile, onProfileClick }: EchoesTabProps) {
  const { echoes, loading, fetchEchoes, sendEcho, deleteEcho } = useProfileEchoes(profileUserId);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<MentionTextareaRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEchoes();
  }, [fetchEchoes]);

  const handleSend = async () => {
    if (!content.trim() && !imageUrl) return;
    setSubmitting(true);
    const result = await sendEcho(content.trim(), imageUrl || undefined);
    if (result) {
      setContent("");
      setImageUrl(null);
    }
    setSubmitting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `echoes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("community-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("community-media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Send echo input (only for non-own profiles) */}
      {currentUserId && !isOwnProfile && (
        <div className="space-y-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Send an Echo
          </p>
          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="" className="h-20 rounded-lg object-cover" />
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive/80 hover:bg-destructive rounded-full"
                onClick={() => setImageUrl(null)}
              >
                <Trash2 className="h-3 w-3 text-destructive-foreground" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <MentionTextarea
              ref={textareaRef}
              value={content}
              onChange={setContent}
              placeholder="Leave an echo on this soul's profile... (@ to tag)"
              className="min-h-[40px] text-sm resize-none border-primary/20"
              rows={2}
            />
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSend}
                disabled={(!content.trim() && !imageUrl) || submitting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      )}

      {/* Echoes list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : echoes.length === 0 ? (
        <div className="text-center py-12">
          <Radio className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "No echoes on your profile yet"
              : "Be the first to leave an echo on this soul's profile"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {echoes.map((echo) => (
            <EchoCard
              key={echo.id}
              echo={echo}
              currentUserId={currentUserId}
              profileUserId={profileUserId}
              onDelete={deleteEcho}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

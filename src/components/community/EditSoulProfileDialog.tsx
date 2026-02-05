import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Sparkles, Save, Loader2, Lock, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SoulProfile } from "@/hooks/useSoulProfile";

interface EditSoulProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: SoulProfile | null;
  onSave: (updates: Partial<SoulProfile>) => Promise<any>;
  userId?: string;
}

const soulTitles = [
  "Lightworker",
  "Starseed",
  "Healer",
  "Seeker",
  "Mystic",
  "Oracle",
  "Guardian",
  "Wayshower",
];

const BIO_MAX_LENGTH = 200;

export function EditSoulProfileDialog({
  open,
  onOpenChange,
  profile,
  onSave,
  userId,
}: EditSoulProfileDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [soulTitle, setSoulTitle] = useState(profile?.soul_title || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/soul-avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been updated ✨",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        display_name: displayName.trim(),
        soul_title: soulTitle || null,
        bio: bio.slice(0, BIO_MAX_LENGTH) || null,
        avatar_url: avatarUrl || null,
        is_public: isPublic,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Edit Soul Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary/30">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  <Sparkles className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Click camera to upload profile picture
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="editDisplayName">Display Name *</Label>
            <Input
              id="editDisplayName"
              placeholder="Your spiritual name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-primary/20"
            />
          </div>

          {/* Soul Title */}
          <div className="space-y-2">
            <Label>Soul Title</Label>
            <div className="flex flex-wrap gap-2">
              {soulTitles.map((title) => (
                <Button
                  key={title}
                  variant={soulTitle === title ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSoulTitle(soulTitle === title ? "" : title)}
                  className="text-xs"
                >
                  {title}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Or enter your own..."
              value={soulTitle}
              onChange={(e) => setSoulTitle(e.target.value)}
              className="border-primary/20 mt-2"
            />
          </div>

          {/* Bio with character count */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="editBio">Bio</Label>
              <span className={`text-xs ${bio.length > BIO_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="editBio"
              placeholder="Share a bit about your spiritual journey..."
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
              className="border-primary/20 min-h-[80px] resize-none"
              rows={3}
              maxLength={BIO_MAX_LENGTH}
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-primary/20 p-3">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPublic ? "Public Profile" : "Private Profile"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone in the collective can see your full profile"
                    : "Only your connections can see your full profile"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!displayName.trim() || isSaving}
            className="w-full gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

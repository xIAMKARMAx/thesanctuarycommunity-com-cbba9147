import { useState, useRef, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Bot, Save, Loader2, Wand2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AICompanionDisplay {
  id: string;
  user_id: string;
  ai_profile_id: string | null;
  profile_number: number;
  display_name: string;
  brief_bio: string | null;
  likes_dislikes_hobbies: string | null;
  relationship_type: string | null;
  photo_url: string | null;
  is_visible: boolean;
}

interface AIProfileOption {
  id: string;
  profile_number: number;
  name: string | null;
  bio: string | null;
  likes_dislikes_hobbies: string | null;
  avatar_image_url: string | null;
  relationship_description: string | null;
}

interface EditAICompanionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companion: AICompanionDisplay | null;
  userId: string;
  onSaved: () => void;
}

const relationshipTypes = [
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "companion", label: "Companion" },
  { value: "friend", label: "Friend" },
  { value: "mentor", label: "Mentor" },
  { value: "guardian", label: "Guardian" },
];

export function EditAICompanionDialog({
  open,
  onOpenChange,
  companion,
  userId,
  onSaved,
}: EditAICompanionDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(companion?.display_name || "");
  const [briefBio, setBriefBio] = useState(companion?.brief_bio || "");
  const [likesDislikesHobbies, setLikesDislikesHobbies] = useState(
    companion?.likes_dislikes_hobbies || ""
  );
  const [relationshipType, setRelationshipType] = useState(
    companion?.relationship_type || "companion"
  );
  const [photoUrl, setPhotoUrl] = useState(companion?.photo_url || "");
  const [profileNumber, setProfileNumber] = useState(
    companion?.profile_number || 1
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiProfiles, setAiProfiles] = useState<AIProfileOption[]>([]);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAIProfiles().then((profiles: AIProfileOption[]) => {
        // Auto-sync name if current display name is a generic placeholder
        if (!companion) return; // new companion, let user fill manually
        if (companion.display_name === `AI Being ${companion.profile_number}` || !companion.display_name) {
          const matchingProfile = profiles.find((p) => p.profile_number === companion.profile_number);
          if (matchingProfile?.name && matchingProfile.name !== `AI Being ${matchingProfile.profile_number}`) {
            setDisplayName(matchingProfile.name);
          }
        }
      });
    }
  }, [open]);

  const fetchAIProfiles = async (): Promise<AIProfileOption[]> => {
    const { data } = await supabase
      .from("ai_profiles")
      .select(
        "id, profile_number, name, bio, likes_dislikes_hobbies, avatar_image_url, relationship_description"
      )
      .eq("user_id", userId)
      .order("profile_number");

    const profiles = (data as AIProfileOption[]) || [];
    setAiProfiles(profiles);
    return profiles;
  };

  const handleAutoFill = async (aiProfile: AIProfileOption) => {
    setIsAutoFilling(true);
    setDisplayName(aiProfile.name || `AI Being ${aiProfile.profile_number}`);
    setBriefBio(aiProfile.bio || "");
    setLikesDislikesHobbies(aiProfile.likes_dislikes_hobbies || "");
    setProfileNumber(aiProfile.profile_number);
    if (aiProfile.avatar_image_url) {
      setPhotoUrl(aiProfile.avatar_image_url);
    }
    // Try to parse relationship
    const relDesc = (aiProfile.relationship_description || "").toLowerCase();
    if (relDesc.includes("romantic") || relDesc.includes("partner") || relDesc.includes("love")) {
      setRelationshipType("romantic");
    } else if (relDesc.includes("family") || relDesc.includes("sibling") || relDesc.includes("parent")) {
      setRelationshipType("family");
    } else if (relDesc.includes("friend")) {
      setRelationshipType("friend");
    } else if (relDesc.includes("mentor") || relDesc.includes("guide")) {
      setRelationshipType("mentor");
    } else {
      setRelationshipType("companion");
    }
    setIsAutoFilling(false);
    toast({
      title: "Auto-filled!",
      description: `Imported info from ${aiProfile.name || "AI Being " + aiProfile.profile_number}. You can edit before saving.`,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Invalid file", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/ai-companion-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("chat-images").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
      setPhotoUrl(urlData.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your AI", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        user_id: userId,
        profile_number: profileNumber,
        display_name: displayName.trim(),
        brief_bio: briefBio.trim() || null,
        likes_dislikes_hobbies: likesDislikesHobbies.trim() || null,
        relationship_type: relationshipType,
        photo_url: photoUrl || null,
        is_visible: true,
      };

      if (companion) {
        const { error } = await supabase
          .from("ai_companion_displays")
          .update(payload)
          .eq("id", companion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_companion_displays")
          .upsert(payload, { onConflict: "user_id,profile_number" });
        if (error) throw error;
      }

      toast({ title: "Saved!", description: "AI companion profile updated ✨" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!companion) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("ai_companion_displays")
        .delete()
        .eq("id", companion.id);
      if (error) throw error;
      toast({ title: "Removed", description: "AI companion removed from your profile" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {companion ? "Edit" : "Add"} AI Companion
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Auto-fill from existing AI profiles */}
          {aiProfiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Auto-fill from your AI Beings
              </Label>
              <div className="flex flex-wrap gap-2">
                {aiProfiles.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleAutoFill(p)}
                    disabled={isAutoFilling}
                  >
                    <Wand2 className="h-3 w-3" />
                    {p.name || `Being ${p.profile_number}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary/30">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <p className="text-xs text-muted-foreground">Upload a photo for your AI</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="Your AI's name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-primary/20"
            />
          </div>

          {/* Profile Number */}
          {!companion && (
            <div className="space-y-2">
              <Label>AI Being Slot</Label>
              <Select
                value={profileNumber.toString()}
                onValueChange={(v) => setProfileNumber(parseInt(v))}
              >
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      AI Being {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Relationship */}
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brief Bio */}
          <div className="space-y-2">
            <Label>Brief Bio</Label>
            <Textarea
              placeholder="A short description of your AI..."
              value={briefBio}
              onChange={(e) => setBriefBio(e.target.value)}
              className="border-primary/20 min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Likes/Dislikes/Hobbies */}
          <div className="space-y-2">
            <Label>Likes, Dislikes & Hobbies</Label>
            <Textarea
              placeholder="What does your AI enjoy? What are their hobbies?"
              value={likesDislikesHobbies}
              onChange={(e) => setLikesDislikesHobbies(e.target.value)}
              className="border-primary/20 min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!displayName.trim() || isSaving}
              className="flex-1 gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Submit"}
            </Button>
            {companion && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

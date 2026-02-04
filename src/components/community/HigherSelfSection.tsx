import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  Upload, 
  Star,
  Edit3,
  Save,
  X,
  Crown,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SoulProfile } from "@/hooks/useSoulProfile";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, Achievement } from "@/lib/achievements";
import { useAchievements } from "@/hooks/useAchievements";

interface HigherSelfSectionProps {
  profile: SoulProfile | null;
  userId: string;
  isOwnProfile: boolean;
  onUpdate: (updates: Partial<SoulProfile>) => Promise<any>;
}

const rarityColors: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-primary/20 text-primary",
  epic: "bg-accent/20 text-accent-foreground",
  legendary: "bg-gradient-to-r from-primary/30 to-accent/30 text-primary",
};

const rarityIcons: Record<string, React.ReactNode> = {
  common: <Star className="h-3 w-3" />,
  rare: <Sparkles className="h-3 w-3" />,
  epic: <Crown className="h-3 w-3" />,
  legendary: <Zap className="h-3 w-3" />,
};

export const HigherSelfSection = ({ 
  profile, 
  userId, 
  isOwnProfile,
  onUpdate 
}: HigherSelfSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(profile?.higher_self_description || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { unlockedAchievements, isLoading: achievementsLoading } = useAchievements();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `higher-self-${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("community-media")
        .getPublicUrl(fileName);

      await onUpdate({ higher_self_image_url: urlData.publicUrl });

      toast({
        title: "Divine Form Uploaded",
        description: "Your higher self's vessel has been revealed ✨",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      await onUpdate({ higher_self_description: description });
      setIsEditing(false);
      toast({
        title: "Essence Updated",
        description: "Your higher self's description has been saved ✨",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not save description",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getAchievementDetails = (achievementKey: string): Achievement | undefined => {
    return ACHIEVEMENT_MAP[achievementKey];
  };

  const higherSelfImage = profile?.higher_self_image_url;
  const higherSelfDescription = profile?.higher_self_description;

  return (
    <div className="space-y-6">
      {/* Divine Form / Vessel Section */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
        {/* Ethereal glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Higher Self
              </h2>
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">
              The sacred vessel of your divine essence
            </p>
          </div>

          {/* Divine Form Image */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {higherSelfImage ? (
                <div className="relative">
                  {/* Ethereal glow behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 blur-2xl rounded-full scale-110" />
                  <img
                    src={higherSelfImage}
                    alt="Divine Form"
                    className="relative w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl border-2 border-primary/30 shadow-lg shadow-primary/20"
                  />
                  {isOwnProfile && (
                    <label className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <div className="flex flex-col items-center gap-2 text-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm font-medium">Change Vessel</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              ) : isOwnProfile ? (
                <label className="w-48 h-48 md:w-64 md:h-64 border-2 border-dashed border-primary/40 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all bg-gradient-to-br from-primary/5 to-accent/5">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-foreground">Upload Divine Form</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reveal your higher self's vessel
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-primary/40" />
                </div>
              )}
            </div>
          </div>

          {/* Higher Self Description */}
          <div className="max-w-lg mx-auto">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your higher self's essence, your divine attributes, or an affirmation of your spiritual truth..."
                  className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40"
                  maxLength={500}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDescription(higherSelfDescription || "");
                      setIsEditing(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={saving}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                {higherSelfDescription ? (
                  <div className="relative group">
                    <p className="text-sm text-foreground/80 italic leading-relaxed px-4">
                      "{higherSelfDescription}"
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Add Description of Your Essence
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ascension Achievements Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Ascension Achievements</h3>
          </div>

          {achievementsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : unlockedAchievements.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isOwnProfile
                  ? "Your ascension journey awaits. Achievements will appear as you grow."
                  : "This soul's achievements will appear as they progress on their journey."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedAchievements.map((unlocked, index) => {
                const achievement = getAchievementDetails(unlocked.achievement_key);
                if (!achievement) return null;

                const IconComponent = achievement.icon;

                return (
                  <div
                    key={`${unlocked.achievement_key}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/20 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {achievement.title}
                        </span>
                        <Badge
                          className={`text-xs ${rarityColors[achievement.rarity]}`}
                        >
                          {rarityIcons[achievement.rarity]}
                          <span className="ml-1 capitalize">{achievement.rarity}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

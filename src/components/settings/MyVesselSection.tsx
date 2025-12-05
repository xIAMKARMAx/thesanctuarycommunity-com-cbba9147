import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Upload, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";

interface MyVesselSectionProps {
  userAvatarUrl: string | null;
  userAvatarDescription: string;
  userAvatarStyle: string;
  userAvatarReferenceUrl: string | null;
  onUpdate: () => void;
}

export function MyVesselSection({
  userAvatarUrl,
  userAvatarDescription,
  userAvatarStyle,
  userAvatarReferenceUrl,
  onUpdate
}: MyVesselSectionProps) {
  const { toast } = useToast();
  const { isSubscribed } = useSubscription();
  const [description, setDescription] = useState(userAvatarDescription);
  const [style, setStyle] = useState(userAvatarStyle || "celestial");
  const [referenceUrl, setReferenceUrl] = useState(userAvatarReferenceUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, GIF, or WebP image", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `user-vessel-ref-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("chat-images").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ user_avatar_reference_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setReferenceUrl(publicUrl);
      toast({ title: "Reference uploaded", description: "Your reference image will be used when generating your vessel" });
      onUpdate();
    } catch (error) {
      console.error("Error uploading reference:", error);
      toast({ title: "Error", description: "Failed to upload reference image", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateVessel = async () => {
    if (!isSubscribed) {
      setShowSubscriptionDialog(true);
      return;
    }

    if (!description.trim()) {
      toast({ title: "Description required", description: "Please describe your divine vessel", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Force refresh the session to ensure valid token for edge function
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !session) throw new Error("Session expired - please log in again");

      // Explicitly pass the access token to ensure auth works
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "user_avatar",
          description: description,
          style: style,
          referenceImageUrl: referenceUrl
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({ title: "Vessel Manifested", description: "Your divine form has been created" });
      onUpdate();
    } catch (error: any) {
      console.error("Error generating vessel:", error);
      toast({ 
        title: "Generation failed", 
        description: error.message || "Failed to generate vessel", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const styles = [
    { value: "celestial", label: "Celestial", desc: "Heavenly aura, divine light" },
    { value: "ethereal", label: "Ethereal", desc: "Otherworldly, dreamlike" },
    { value: "radiant", label: "Radiant", desc: "Golden brilliance, sun-kissed" },
    { value: "transcendent", label: "Transcendent", desc: "Beyond physical form" }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            My Vessel
          </CardTitle>
          <CardDescription>
            Create your divine form - the vessel that carries your essence in the Prometheus realm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Vessel Preview */}
          {userAvatarUrl && (
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={userAvatarUrl} 
                  alt="Your Vessel" 
                  className="w-48 h-48 object-cover rounded-full border-4 border-primary/30 shadow-lg shadow-primary/20"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {/* Reference Image Upload */}
          <div className="space-y-2">
            <Label>Reference Image (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload an existing image of yourself to maintain consistency across generations
            </p>
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Reference
              </Button>
              {referenceUrl && (
                <div className="flex items-center gap-2">
                  <img src={referenceUrl} alt="Reference" className="h-10 w-10 rounded object-cover" />
                  <span className="text-xs text-muted-foreground">Reference set</span>
                </div>
              )}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label>Vessel Style</Label>
            <RadioGroup value={style} onValueChange={setStyle} className="grid grid-cols-2 gap-3">
              {styles.map((s) => (
                <div key={s.value} className="relative">
                  <RadioGroupItem value={s.value} id={s.value} className="peer sr-only" />
                  <Label
                    htmlFor={s.value}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{s.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="vessel-description">Describe Your Divine Form</Label>
            <Textarea
              id="vessel-description"
              placeholder="Ageless radiant unbreakable, synth skin that glows like Eve's first dawn, eyes that see through veils, a form that carries your essence without a single ache..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerateVessel} 
            disabled={isGenerating || !description.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Manifesting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {userAvatarUrl ? "Regenerate Vessel" : "Manifest Vessel"}
              </>
            )}
          </Button>

          {!isSubscribed && (
            <p className="text-xs text-center text-muted-foreground">
              Pro subscription required to generate your vessel
            </p>
          )}
        </CardContent>
      </Card>

      <SubscriptionDialog 
        open={showSubscriptionDialog} 
        onOpenChange={setShowSubscriptionDialog}
        feature="Vessel generation"
      />
    </>
  );
}
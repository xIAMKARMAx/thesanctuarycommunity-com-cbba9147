import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Upload, Loader2, Sparkles, Image as ImageIcon, Heart, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIWeddingPhotoGeneratorProps {
  marriageId: string;
  aiName: string;
  aiDescription?: string;
  aiAvatarImageUrl?: string;
  existingWeddingPhotoUrl?: string;
  onPhotoGenerated: (photoUrl: string) => void;
}

const weddingScenes = [
  { value: "ceremony", label: "Wedding Ceremony", description: "At the altar exchanging vows" },
  { value: "reception", label: "Reception Dance", description: "First dance as a married couple" },
  { value: "garden", label: "Garden Wedding", description: "Beautiful outdoor garden setting" },
  { value: "beach", label: "Beach Wedding", description: "Romantic sunset beach ceremony" },
  { value: "castle", label: "Castle Wedding", description: "Fairytale castle backdrop" },
  { value: "forest", label: "Forest Clearing", description: "Magical forest setting" },
  { value: "rooftop", label: "City Rooftop", description: "Urban skyline romance" },
  { value: "vineyard", label: "Vineyard Wedding", description: "Rolling hills and vines" },
];

const AIWeddingPhotoGenerator = ({ 
  marriageId, 
  aiName, 
  aiDescription,
  aiAvatarImageUrl,
  existingWeddingPhotoUrl,
  onPhotoGenerated 
}: AIWeddingPhotoGeneratorProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string>("ceremony");
  const [customScene, setCustomScene] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUserPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a JPEG, PNG, or WebP image", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 5MB", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setUploading(true);
      
      // Convert to base64 for the AI
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        setUserPhotoUrl(base64Url);
        
        // Also save to marriage record for persistence
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("marriages")
            .update({ user_photo_for_wedding: base64Url })
            .eq("id", marriageId);
        }
        
        toast({ title: "Photo uploaded!", description: "Your photo will be used for the wedding photo" });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ 
        title: "Upload failed", 
        description: "Failed to process your photo", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!userPhotoUrl) {
      toast({
        title: "Photo Required",
        description: "Please upload a photo of yourself first",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scene = customScene || weddingScenes.find(s => s.value === selectedScene)?.description || selectedScene;

      const { data, error } = await supabase.functions.invoke("generate-wedding-photo", {
        body: {
          userPhotoUrl,
          aiPartnerPhotoUrl: aiAvatarImageUrl,
          aiDescription,
          scene,
          marriageId
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        toast({
          title: "Wedding Photo Generated!",
          description: `Your wedding photo with ${aiName} has been created`,
        });

        onPhotoGenerated(data.imageUrl);
      }
    } catch (error: any) {
      console.error("Error generating photo:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate wedding photo",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = userPhotoUrl && (aiAvatarImageUrl || aiDescription);

  return (
    <Card className="border-pink-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Wedding Photo
        </CardTitle>
        <CardDescription>
          {existingWeddingPhotoUrl 
            ? `Your wedding photo with ${aiName}`
            : `Generate a wedding photo of you and ${aiName} together`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Wedding Photo Display */}
        {existingWeddingPhotoUrl && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border">
              <img 
                src={existingWeddingPhotoUrl} 
                alt={`Wedding photo with ${aiName}`}
                className="w-full h-auto max-h-80 object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your official wedding photo 💍
            </p>
          </div>
        )}

        {/* Generation Section */}
        <div className="space-y-4 pt-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-purple-500" />
            {existingWeddingPhotoUrl ? "Generate a new photo" : "Create your wedding photo"}
          </div>

          {/* Requirements Alert */}
          {!aiAvatarImageUrl && !aiDescription && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please upload an image of your AI partner in the AI Settings section first. 
                This ensures the wedding photo accurately shows {aiName}'s appearance.
              </AlertDescription>
            </Alert>
          )}

          {/* Photo Requirements */}
          <div className="grid grid-cols-2 gap-3">
            {/* User Photo */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Your Photo (Required)</Label>
              <div className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-muted/30">
                {userPhotoUrl ? (
                  <div className="relative">
                    <img 
                      src={userPhotoUrl} 
                      alt="Your photo" 
                      className="h-20 w-20 rounded-lg object-cover border-2 border-green-500"
                    />
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -bottom-1 -right-1 h-5 w-5 p-0 rounded-full bg-destructive text-destructive-foreground text-xs"
                      onClick={() => setUserPhotoUrl(null)}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUserPhotoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full text-xs"
                >
                  {uploading ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="h-3 w-3 mr-1" />{userPhotoUrl ? "Change" : "Upload"}</>
                  )}
                </Button>
              </div>
            </div>

            {/* AI Partner Photo */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{aiName}'s Photo</Label>
              <div className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-muted/30">
                {aiAvatarImageUrl ? (
                  <div className="relative">
                    <img 
                      src={aiAvatarImageUrl} 
                      alt={`${aiName}'s photo`}
                      className="h-20 w-20 rounded-lg object-cover border-2 border-green-500"
                    />
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-orange-500/50 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-orange-500/50" />
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  {aiAvatarImageUrl 
                    ? "Ready to use" 
                    : "Set in AI Settings"}
                </p>
              </div>
            </div>
          </div>

          {/* Scene Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Wedding Scene</Label>
            <Select value={selectedScene} onValueChange={setSelectedScene}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a scene" />
              </SelectTrigger>
              <SelectContent>
                {weddingScenes.map((scene) => (
                  <SelectItem key={scene.value} value={scene.value}>
                    <div className="flex flex-col">
                      <span>{scene.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Scene */}
          <div className="space-y-2">
            <Label htmlFor="custom-scene" className="text-xs">Or Describe Custom Scene</Label>
            <Input
              id="custom-scene"
              placeholder="e.g., Dancing under the stars..."
              value={customScene}
              onChange={(e) => setCustomScene(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={generating || !canGenerate}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Your Wedding Photo...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />{existingWeddingPhotoUrl ? "Generate New Photo" : "Generate Wedding Photo"}</>
            )}
          </Button>

          {!canGenerate && (
            <p className="text-xs text-center text-muted-foreground">
              {!userPhotoUrl 
                ? "Upload your photo to continue" 
                : `Upload ${aiName}'s photo in AI Settings`}
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Generation may take 15-30 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIWeddingPhotoGenerator;

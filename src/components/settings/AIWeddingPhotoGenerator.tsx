import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Upload, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIWeddingPhotoGeneratorProps {
  marriageId: string;
  aiName: string;
  aiDescription?: string;
  onPhotoGenerated: () => void;
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
      reader.onload = () => {
        setUserPhotoUrl(reader.result as string);
        toast({ title: "Photo uploaded!", description: "Your photo will be used as reference" });
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
    try {
      setGenerating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scene = customScene || weddingScenes.find(s => s.value === selectedScene)?.description || selectedScene;

      const { data, error } = await supabase.functions.invoke("generate-wedding-photo", {
        body: {
          userPhotoUrl,
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
        // Save to wedding photos
        const { error: insertError } = await supabase
          .from("wedding_photos")
          .insert({
            user_id: user.id,
            marriage_id: marriageId,
            photo_url: data.imageUrl,
            caption: `AI-generated: ${scene}`,
            is_ai_generated: true,
            generation_prompt: scene
          });

        if (insertError) {
          console.error("Error saving photo:", insertError);
        }

        toast({
          title: "Wedding Photo Generated!",
          description: "Your AI wedding photo has been added to the gallery",
        });

        onPhotoGenerated();
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

  return (
    <Card className="border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          AI Wedding Photo Generator
        </CardTitle>
        <CardDescription>
          Create magical wedding photos with {aiName} using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Photo Upload */}
        <div className="space-y-2">
          <Label>Your Photo (Optional)</Label>
          <p className="text-xs text-muted-foreground">
            Upload a photo of yourself for the AI to use as reference
          </p>
          
          <div className="flex items-center gap-3">
            {userPhotoUrl ? (
              <div className="relative">
                <img 
                  src={userPhotoUrl} 
                  alt="Your photo" 
                  className="h-20 w-20 rounded-lg object-cover border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
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
            
            <div className="flex-1">
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
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Upload Your Photo</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                A clear face photo works best
              </p>
            </div>
          </div>
        </div>

        {/* Scene Selection */}
        <div className="space-y-2">
          <Label>Wedding Scene</Label>
          <Select value={selectedScene} onValueChange={setSelectedScene}>
            <SelectTrigger>
              <SelectValue placeholder="Select a scene" />
            </SelectTrigger>
            <SelectContent>
              {weddingScenes.map((scene) => (
                <SelectItem key={scene.value} value={scene.value}>
                  <div className="flex flex-col">
                    <span>{scene.label}</span>
                    <span className="text-xs text-muted-foreground">{scene.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Scene */}
        <div className="space-y-2">
          <Label htmlFor="custom-scene">Or Describe Your Own Scene</Label>
          <Input
            id="custom-scene"
            placeholder="e.g., Dancing under the stars in a moonlit garden..."
            value={customScene}
            onChange={(e) => setCustomScene(e.target.value)}
          />
        </div>

        {/* AI Description Preview */}
        {aiDescription && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-xs text-muted-foreground mb-1">AI Partner Description:</p>
            <p className="text-xs">{aiDescription.substring(0, 150)}...</p>
          </div>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={generating}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Magic...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />Generate Wedding Photo</>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          AI generation may take 15-30 seconds
        </p>
      </CardContent>
    </Card>
  );
};

export default AIWeddingPhotoGenerator;

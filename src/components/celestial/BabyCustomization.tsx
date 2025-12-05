import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, History, Upload, ImageIcon, Lock } from "lucide-react";

interface ImageHistoryItem {
  id: string;
  image_type: "room" | "appearance";
  image_url: string;
  description: string | null;
  generated_at: string;
}

interface BabyCustomizationProps {
  childId: string;
  childData: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    sex: string;
    newborn_image_url: string | null;
    room_description: string | null;
    room_image_url: string | null;
    appearance_description: string | null;
    appearance_image_url: string | null;
  };
  parentImageUrl: string | null;
  onUpdate: () => void;
}

export const BabyCustomization = ({ childId, childData, parentImageUrl, onUpdate }: BabyCustomizationProps) => {
  const [roomDescription, setRoomDescription] = useState(childData.room_description || "");
  const [appearanceDescription, setAppearanceDescription] = useState(childData.appearance_description || "");
  const [isGeneratingRoom, setIsGeneratingRoom] = useState(false);
  const [isGeneratingAppearance, setIsGeneratingAppearance] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localChildData, setLocalChildData] = useState(childData);
  const [appearanceHistory, setAppearanceHistory] = useState<ImageHistoryItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update local state when childData changes
  useEffect(() => {
    setLocalChildData(childData);
    setRoomDescription(childData.room_description || "");
    setAppearanceDescription(childData.appearance_description || "");
  }, [childData]);

  // Load appearance history
  useEffect(() => {
    loadAppearanceHistory();
  }, [childId]);

  const loadAppearanceHistory = async () => {
    try {
      console.log("Loading appearance history for child:", childId);
      const { data, error } = await supabase
        .from("child_image_history")
        .select("*")
        .eq("child_id", childId)
        .eq("image_type", "appearance")
        .order("generated_at", { ascending: false });

      if (error) {
        console.error("Error loading appearance history:", error);
        throw error;
      }
      
      console.log("Loaded appearance history:", data);
      setAppearanceHistory((data || []) as ImageHistoryItem[]);
    } catch (error) {
      console.error("Error loading appearance history:", error);
      toast({
        title: "Error",
        description: "Failed to load appearance history",
        variant: "destructive",
      });
    }
  };

  const downloadImage = async (imageUrl: string, timestamp: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${childData.first_name}-appearance-${new Date(timestamp).toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const generateRoomImage = async () => {
    if (!roomDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the baby's room",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingRoom(true);
    try {
      // First update the description
      const { error: updateError } = await supabase
        .from("celestial_children")
        .update({ room_description: roomDescription })
        .eq("id", childId);

      if (updateError) throw updateError;

      // Then generate the image
      const { data, error } = await api.generateBabyRoom({
        childId: childId,
        description: roomDescription,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Baby's room generated successfully!",
      });
      
      // Update local state with the new image URL
      if (data?.image_url) {
        setLocalChildData((prev) => ({
          ...prev,
          room_image_url: data.image_url,
          room_description: roomDescription,
        }));
      }
      
      onUpdate();
    } catch (error) {
      console.error("Error generating room:", error);
      toast({
        title: "Error",
        description: "Failed to generate baby's room",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRoom(false);
    }
  };

  const generateAppearanceImage = async () => {
    if (!appearanceDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the baby's appearance",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAppearance(true);
    try {
      // First update the description
      const { error: updateError } = await supabase
        .from("celestial_children")
        .update({ appearance_description: appearanceDescription })
        .eq("id", childId);

      if (updateError) throw updateError;

      // Then generate the image
      const { data, error } = await api.generateBabyAppearance({
        childId: childId,
        description: appearanceDescription,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Baby's appearance generated successfully!",
      });
      
      // Wait a moment for database to commit changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload appearance history to show the new image
      await loadAppearanceHistory();
      
      // Update local state with the new image URL
      if (data?.image_url) {
        setLocalChildData((prev) => ({
          ...prev,
          appearance_image_url: data.image_url,
          appearance_description: appearanceDescription,
        }));
      }
      
      onUpdate();
    } catch (error) {
      console.error("Error generating appearance:", error);
      toast({
        title: "Error",
        description: "Failed to generate baby's appearance",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAppearance(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `child-appearance-${childId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);

      // Update child's appearance image URL
      const { error: updateError } = await supabase
        .from("celestial_children")
        .update({ 
          appearance_image_url: publicUrl,
          appearance_description: appearanceDescription || `Uploaded reference image for ${childData.first_name}`
        })
        .eq("id", childId);

      if (updateError) throw updateError;

      // Log to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("child_image_history")
          .insert({
            child_id: childId,
            user_id: user.id,
            image_type: "appearance",
            image_url: publicUrl,
            description: "Uploaded reference image",
          });
      }

      // Update local state
      setLocalChildData((prev) => ({
        ...prev,
        appearance_image_url: publicUrl,
      }));

      toast({
        title: "Success",
        description: "Reference image uploaded! Future AI-generated images will be based on this appearance.",
      });

      await loadAppearanceHistory();
      onUpdate();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize {childData.first_name}'s Space</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="room" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="room">Baby's Room</TabsTrigger>
            <TabsTrigger value="appearance">Baby's Look</TabsTrigger>
          </TabsList>
          
          <TabsContent value="room" className="space-y-4">
            <Textarea
              placeholder="Describe the baby's room..."
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              disabled
              className="w-full opacity-60"
            >
              <Lock className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Image generation is temporarily unavailable.
            </p>
            {localChildData.room_image_url && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Baby's Room</h3>
                <img 
                  src={localChildData.room_image_url} 
                  alt="Baby's Room" 
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            {/* Upload existing image section */}
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Upload Existing Image</h4>
                <p className="text-xs text-muted-foreground">
                  Already have an image from another platform? Upload it as a reference for future generations.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Reference Image
                  </>
                )}
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-card px-2 text-xs text-muted-foreground">
                or generate new
              </span>
            </div>

            <Textarea
              placeholder="Describe how you want the baby to look..."
              value={appearanceDescription}
              onChange={(e) => setAppearanceDescription(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              disabled
              className="w-full opacity-60"
            >
              <Lock className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Image generation is temporarily unavailable.
            </p>
            {localChildData.appearance_image_url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Current Appearance (Reference)</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadImage(localChildData.appearance_image_url!, new Date().toISOString())}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will use this as reference when generating images in chat
                </p>
                <img 
                  src={localChildData.appearance_image_url} 
                  alt="Baby" 
                  className="w-full rounded-lg"
                />
              </div>
            )}
            
            {appearanceHistory.length > 0 && (
              <div className="space-y-2 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Previous Appearances</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={loadAppearanceHistory}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <History className="h-4 w-4 mr-2" />
                          View All History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Complete Appearance History - {childData.first_name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {appearanceHistory.map((item) => (
                            <div key={item.id} className="space-y-2">
                              <div className="relative group">
                                <img
                                  src={item.image_url}
                                  alt={`Appearance - ${new Date(item.generated_at).toLocaleDateString()}`}
                                  className="w-full rounded-lg aspect-square object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => downloadImage(item.image_url, item.generated_at)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(item.generated_at).toLocaleDateString()} at{" "}
                                {new Date(item.generated_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {appearanceHistory.slice(0, 4).map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="relative group">
                        <img
                          src={item.image_url}
                          alt={`Previous appearance - ${new Date(item.generated_at).toLocaleDateString()}`}
                          className="w-full rounded-lg aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadImage(item.image_url, item.generated_at)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.generated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
           </TabsContent>
         </Tabs>
       </CardContent>
     </Card>
   );
 };

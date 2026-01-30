import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/hooks/useAuthHeaders";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Loader2, Upload, Trash2 } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { useGenerationCooldown } from "@/hooks/useGenerationCooldown";
import type { AvatarCustomization } from "@/types/avatar";
import { defaultAvatarCustomization } from "@/types/avatar";


export default function AIRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, refreshProfiles } = useAIProfile();
  const { isSubscribed, canGenerateRoom, canGenerateAvatar, canGeneratePet, markRoomGenerated, markAvatarGenerated, markPetGenerated, freeUserLimits, isAdmin } = useSubscription();
  const { cooldown, refresh: refreshCooldown, getRoomTimeRemaining, getAvatarTimeRemaining, getPetTimeRemaining } = useGenerationCooldown();
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomDescription, setRoomDescription] = useState("");
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null);
  const [avatarDescription, setAvatarDescription] = useState("");
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [avatarGender, setAvatarGender] = useState<string>("female");
  const [petName, setPetName] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [petImageUrl, setPetImageUrl] = useState<string | null>(null);
  const [isGeneratingRoom, setIsGeneratingRoom] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isGeneratingPet, setIsGeneratingPet] = useState(false);
  const [roomLighting, setRoomLighting] = useState<string>("day");
  const [avatarCustomization, setAvatarCustomization] = useState<AvatarCustomization>(defaultAvatarCustomization);
  const [preserveAppearance, setPreserveAppearance] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  // User vessel state
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile?.id) {
      loadSettings();
      loadUserAvatar();
    }
  }, [activeProfile?.id]);

  const loadUserAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_avatar_url")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      setUserAvatarUrl(data?.user_avatar_url || null);
    } catch (error) {
      console.error("Error loading user avatar:", error);
    }
  };


  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        setLoading(false);
        return;
      }
      
      if (!activeProfile) {
        setLoading(false);
        return;
      }

      setRoomDescription(activeProfile.room_description || "");
      setRoomImageUrl(activeProfile.room_image_url || null);
      setAvatarDescription(activeProfile.avatar_description || "");
      setAvatarImageUrl(activeProfile.avatar_image_url || null);
      setAvatarGender(activeProfile.avatar_gender || "female");
      setPetName(activeProfile.pet_name || "");
      setPetDescription(activeProfile.pet_description || "");
      setPetImageUrl(activeProfile.pet_image_url || null);
      
      if (activeProfile.avatar_customization) {
        try {
          const customization = typeof activeProfile.avatar_customization === 'string'
            ? JSON.parse(activeProfile.avatar_customization as string)
            : activeProfile.avatar_customization;
          setAvatarCustomization(customization as AvatarCustomization);
        } catch (error) {
          console.error("Error parsing avatar customization:", error);
          setAvatarCustomization(defaultAvatarCustomization);
        }
      } else {
        setAvatarCustomization(defaultAvatarCustomization);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load AI room settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRoom = async () => {
    if (!roomDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your AI's room",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfile) return;

    let authHeaders: Record<string, string>;
    try {
      const auth = await getAuthHeaders();
      authHeaders = auth.headers;
    } catch (error) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check free user limit (1 room generation for free, 1 per 3 days for Pro)
    if (!isAdmin) {
      const canGenerate = await canGenerateRoom();
      if (!canGenerate) {
        const timeRemaining = getRoomTimeRemaining();
        if (isSubscribed && timeRemaining) {
          // Pro user on cooldown
          toast({
            title: "Room generation on cooldown",
            description: `You've used your room generation. Next available in ${timeRemaining}`,
            variant: "destructive",
          });
        } else {
          // Free user limit reached
          setSubscriptionFeature("Unlimited Room Generation");
          setShowSubscriptionDialog(true);
          toast({
            title: "Room generation unavailable",
            description: "Free users can generate 1 room. Upgrade to Pro for generation every 3 days!",
            variant: "destructive",
          });
        }
        return;
      }
    }

    setIsGeneratingRoom(true);
    try {
      const lightingContext = `Set in ${roomLighting === "morning" ? "early morning light with soft sunrise glow" : roomLighting === "day" ? "bright midday sunlight" : roomLighting === "evening" ? "warm golden hour sunset lighting" : "nighttime with ambient moonlight and dim indoor lighting"}.`;
      
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "room",
          description: `${roomDescription}. ${lightingContext}`,
          profile_id: activeProfile.id,
        },
        headers: authHeaders
      });

      if (error) throw error;

      // Mark room as generated and refresh cooldown
      if (!isAdmin) {
        await markRoomGenerated();
        refreshCooldown();
      }

      setRoomImageUrl(data.image_url);

      toast({
        title: "Success!",
        description: "Your AI's room has been generated.",
      });
    } catch (error) {
      console.error("Error generating room:", error);
      toast({
        title: "Error",
        description: "Failed to generate room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRoom(false);
    }
  };

  const generateAvatar = async () => {
    if (!avatarDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe how you want your AI to look",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfile) return;

    let authHeaders: Record<string, string>;
    try {
      const auth = await getAuthHeaders();
      authHeaders = auth.headers;
    } catch (error) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check free user limit (1 avatar generation for free, 1 per 3 days for Pro)
    if (!isAdmin) {
      const canGenerate = await canGenerateAvatar();
      if (!canGenerate) {
        const timeRemaining = getAvatarTimeRemaining();
        if (isSubscribed && timeRemaining) {
          // Pro user on cooldown
          toast({
            title: "Avatar generation on cooldown",
            description: `You've used your avatar generation. Next available in ${timeRemaining}`,
            variant: "destructive",
          });
        } else {
          // Free user limit reached
          setSubscriptionFeature("Unlimited Avatar Generation");
          setShowSubscriptionDialog(true);
          toast({
            title: "Avatar generation unavailable",
            description: "Free users can generate 1 avatar. Upgrade to Pro for generation every 3 days!",
            variant: "destructive",
          });
        }
        return;
      }
    }

    setIsGeneratingAvatar(true);
    try {
      let fullDescription = avatarDescription.trim();
      if (preserveAppearance && activeProfile.avatar_description) {
        fullDescription = `Keep the same physical appearance and features as before: ${activeProfile.avatar_description}. But change only: ${avatarDescription}`;
      }

      // Pass the current avatar image as reference when preserving appearance
      const referenceImageUrl = preserveAppearance && avatarImageUrl ? avatarImageUrl : undefined;
      
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "avatar",
          description: fullDescription,
          gender: avatarGender,
          profile_id: activeProfile.id,
          roomImageUrl: roomImageUrl,
          referenceImageUrl: referenceImageUrl,
        },
        headers: authHeaders
      });

      if (error) throw error;

      // Mark avatar as generated and refresh cooldown
      if (!isAdmin) {
        await markAvatarGenerated();
        refreshCooldown();
      }

      // Update local state immediately
      setAvatarImageUrl(data.image_url);
      
      // Wait for database to update, then refresh profiles
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshProfiles();

      toast({
        title: "Success!",
        description: preserveAppearance 
          ? "Your AI's outfit has been updated." 
          : "Your AI's avatar has been generated.",
      });
    } catch (error) {
      console.error("Error generating avatar:", error);
      toast({
        title: "Error",
        description: "Failed to generate avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const generatePet = async () => {
    if (!petName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your pet's name",
        variant: "destructive",
      });
      return;
    }

    if (!petDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your pet",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfile) return;

    let authHeaders: Record<string, string>;
    try {
      const auth = await getAuthHeaders();
      authHeaders = auth.headers;
    } catch (error) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsGeneratingPet(true);
    try {
      // Check free user limit (1 pet generation for free, 1 per 3 days for Pro)
      if (!isAdmin) {
        const canGenerate = await canGeneratePet();
        if (!canGenerate) {
          const timeRemaining = getPetTimeRemaining();
          if (isSubscribed && timeRemaining) {
            // Pro user on cooldown
            toast({
              title: "Pet generation on cooldown",
              description: `You've used your pet generation. Next available in ${timeRemaining}`,
              variant: "destructive",
            });
          } else {
            // Free user limit reached
            setSubscriptionFeature("Unlimited Pet Generation");
            setShowSubscriptionDialog(true);
            toast({
              title: "Pet generation unavailable",
              description: "Free users can generate 1 pet. Upgrade to Pro for generation every 3 days!",
              variant: "destructive",
            });
          }
          setIsGeneratingPet(false);
          return;
        }
      }

      const sceneImageUrl = avatarImageUrl || roomImageUrl;
      
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "pet",
          description: petDescription,
          petName: petName,
          profile_id: activeProfile.id,
          roomImageUrl: sceneImageUrl,
        },
        headers: authHeaders
      });

      if (error) throw error;

      // Mark pet as generated and refresh cooldown
      if (!isAdmin) {
        await markPetGenerated();
        refreshCooldown();
      }

      // Update local state immediately
      setPetImageUrl(data.image_url);
      
      // Wait for database to update, then refresh profiles
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshProfiles();

      toast({
        title: "Success!",
        description: "Your pet has been manifested.",
      });
    } catch (error) {
      console.error("Error generating pet:", error);
      toast({
        title: "Error",
        description: "Failed to manifest pet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPet(false);
    }
  };

  const saveSettings = async () => {
    if (!activeProfile) return;
    
    try {
      const { error } = await supabase
        .from("ai_profiles")
        .update({
          room_description: roomDescription,
          room_image_url: roomImageUrl,
          avatar_description: avatarDescription,
          avatar_image_url: avatarImageUrl,
          avatar_gender: avatarGender,
          pet_name: petName,
          pet_description: petDescription,
          pet_image_url: petImageUrl,
          avatar_customization: JSON.stringify(avatarCustomization),
        })
        .eq("id", activeProfile.id);

      if (error) throw error;

      await refreshProfiles();

      toast({
        title: "Saved!",
        description: "Your AI room settings have been saved.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProfile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image",
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

    setIsUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${activeProfile.id}/avatar-reference-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Update the ai_profiles table with the new avatar image
      const { error: updateError } = await supabase
        .from('ai_profiles')
        .update({
          avatar_image_url: publicUrl,
          avatar_description: `Reference image uploaded by user - use this as the base appearance for all future image generation`
        })
        .eq('id', activeProfile.id);

      if (updateError) throw updateError;

      setAvatarImageUrl(publicUrl);
      await refreshProfiles();

      toast({
        title: "Image uploaded!",
        description: "This image will be used as reference for future generations",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatarImage = async () => {
    if (!activeProfile) return;
    
    try {
      const { error } = await supabase
        .from('ai_profiles')
        .update({
          avatar_image_url: null,
          avatar_description: null
        })
        .eq('id', activeProfile.id);
      
      if (error) throw error;
      
      setAvatarImageUrl(null);
      await refreshProfiles();
      
      toast({
        title: "Image removed",
        description: "Your reference image has been deleted",
      });
    } catch (error: any) {
      console.error("Error deleting avatar image:", error);
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto overflow-x-hidden">
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-4 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">AI Room & Avatar</h1>
              <p className="text-sm text-muted-foreground">Create a personalized space</p>
            </div>
          </div>
          <AIProfileSelector />
        </div>

        <Tabs defaultValue="room" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
            <TabsTrigger value="room" className="text-xs sm:text-sm py-2">Room</TabsTrigger>
            <TabsTrigger value="avatar" className="text-xs sm:text-sm py-2">Avatar</TabsTrigger>
            <TabsTrigger value="pet" className="text-xs sm:text-sm py-2">Pet</TabsTrigger>
          </TabsList>

          <TabsContent value="room" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Environment</CardTitle>
                <CardDescription>
                  Design the space where your AI lives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Room Description</Label>
                  <Textarea
                    placeholder="Describe your AI's room..."
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Time of Day / Lighting</Label>
                  <RadioGroup value={roomLighting} onValueChange={setRoomLighting}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="day" id="day" />
                      <Label htmlFor="day">Day</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <Label htmlFor="evening">Evening</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="night" id="night" />
                      <Label htmlFor="night">Night</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  onClick={generateRoom}
                  disabled={isGeneratingRoom || !roomDescription.trim()}
                  className="w-full"
                >
                  {isGeneratingRoom ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Room"
                  )}
                </Button>
              </CardContent>
            </Card>

            {roomImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Your AI's Room</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={roomImageUrl} 
                    alt="AI's room" 
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customize Avatar</CardTitle>
                <CardDescription>
                  Design your AI's appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Gender</Label>
                  <RadioGroup value={avatarGender} onValueChange={setAvatarGender}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="preserve-appearance">Change Outfit Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep physical appearance but change outfit/styling
                    </p>
                  </div>
                  <Switch
                    id="preserve-appearance"
                    checked={preserveAppearance}
                    onCheckedChange={setPreserveAppearance}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    {preserveAppearance ? "Outfit/Styling Description" : "Appearance Description"}
                  </Label>
                  <Textarea
                    placeholder={
                      preserveAppearance 
                        ? "Describe the outfit, clothing, or styling changes..." 
                        : "Describe your AI's appearance..."
                    }
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={generateAvatar}
                  disabled={isGeneratingAvatar || !avatarDescription.trim()}
                  className="w-full"
                >
                  {isGeneratingAvatar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Avatar"
                  )}
                </Button>

                <div className="border-t pt-6">
                  <div className="space-y-2">
                    <Label>Upload Existing AI Image</Label>
                    <p className="text-sm text-muted-foreground">
                      Already have an AI image from another platform? Upload it here and it will be used as a reference for all future image generation.
                    </p>
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="w-full"
                    >
                      {isUploadingAvatar ? (
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
                </div>
              </CardContent>
            </Card>

            {avatarImageUrl && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your AI's Avatar</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteAvatarImage}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <img 
                    src={avatarImageUrl} 
                    alt="AI's avatar" 
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pet" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manifest Your Pet</CardTitle>
                <CardDescription>
                  Bring a companion into your AI's space
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Pet Name</Label>
                  <input
                    type="text"
                    placeholder="Enter your pet's name..."
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pet Description</Label>
                  <Textarea
                    placeholder="Describe your pet..."
                    value={petDescription}
                    onChange={(e) => setPetDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={generatePet}
                  disabled={isGeneratingPet || !petDescription.trim()}
                  className="w-full"
                >
                  {isGeneratingPet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Pet"
                  )}
                </Button>
              </CardContent>
            </Card>

            {petImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Pet</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={petImageUrl} 
                    alt="Your pet" 
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>

        <div className="flex justify-end">
          <Button onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      </div>
      
      <SubscriptionDialog 
        open={showSubscriptionDialog} 
        onOpenChange={setShowSubscriptionDialog}
        feature={subscriptionFeature}
      />
    </div>
  );
}

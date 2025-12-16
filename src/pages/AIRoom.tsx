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
import { ArrowLeft, Loader2, Users, Upload, Lock } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { AIRoomScene } from "@/components/room/AIRoomScene";
import { FamilyRoomScene } from "@/components/room/FamilyRoomScene";
// DISABLED FOR COST SAVINGS - DreamSpace uses interpret-dream
// import { DreamSpace } from "@/components/room/DreamSpace";
import { AvatarCustomizationControls } from "@/components/room/AvatarCustomizationControls";
import type { AvatarCustomization } from "@/types/avatar";
import { defaultAvatarCustomization } from "@/types/avatar";
import { removeBackground, loadImage } from "@/utils/backgroundRemoval";

interface FamilyMember {
  id: string;
  name: string;
  imageUrl: string;
  type: 'avatar' | 'child' | 'pet';
}

export default function AIRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, refreshProfiles } = useAIProfile();
  const { isSubscribed, canGenerateRoom, canGenerateAvatar, markRoomGenerated, markAvatarGenerated, freeUserLimits } = useSubscription();
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
  const [avatarCutoutUrl, setAvatarCutoutUrl] = useState<string | null>(null);
  const [petCutoutUrl, setPetCutoutUrl] = useState<string | null>(null);
  const [showCutouts, setShowCutouts] = useState(true);
  const [preserveAppearance, setPreserveAppearance] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isProcessingPet, setIsProcessingPet] = useState(false);
  const [familyChildren, setFamilyChildren] = useState<FamilyMember[]>([]);
  const [familyPets, setFamilyPets] = useState<FamilyMember[]>([]);
  const [childCutouts, setChildCutouts] = useState<Map<string, string>>(new Map());
  const [petCutouts, setPetCutouts] = useState<Map<string, string>>(new Map());
  const [isProcessingFamily, setIsProcessingFamily] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  // User vessel state
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userAvatarCutoutUrl, setUserAvatarCutoutUrl] = useState<string | null>(null);
  const [isProcessingUserAvatar, setIsProcessingUserAvatar] = useState(false);

  useEffect(() => {
    if (activeProfile?.id) {
      loadSettings();
      loadFamilyMembers();
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

  const loadFamilyMembers = async () => {
    if (!activeProfile) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load children
      const { data: childrenData } = await supabase
        .from("celestial_children")
        .select("id, first_name, last_name, appearance_image_url, newborn_image_url")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id);

      if (childrenData) {
        const childMembers: FamilyMember[] = childrenData
          .filter(c => c.appearance_image_url || c.newborn_image_url)
          .map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            imageUrl: c.appearance_image_url || c.newborn_image_url || "",
            type: 'child' as const
          }));
        setFamilyChildren(childMembers);
      }

      // Load pets
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, image_url, pet_number")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id);

      if (petsData) {
        const petMembers: FamilyMember[] = petsData
          .filter(p => p.image_url)
          .map(p => ({
            id: p.id,
            name: p.name || `Pet ${p.pet_number}`,
            imageUrl: p.image_url || "",
            type: 'pet' as const
          }));
        setFamilyPets(petMembers);
      }
    } catch (error) {
      console.error("Error loading family members:", error);
    }
  };

  // Process cutouts for family members
  useEffect(() => {
    const processChildCutouts = async () => {
      if (familyChildren.length === 0) return;
      setIsProcessingFamily(true);
      
      const newCutouts = new Map<string, string>();
      for (const child of familyChildren) {
        try {
          const img = await loadImage(child.imageUrl);
          const cutoutBlob = await removeBackground(img);
          const cutoutUrl = URL.createObjectURL(cutoutBlob);
          newCutouts.set(child.id, cutoutUrl);
        } catch (error) {
          console.error(`Error processing child cutout for ${child.name}:`, error);
        }
      }
      setChildCutouts(newCutouts);
      setIsProcessingFamily(false);
    };

    processChildCutouts();
    
    return () => {
      childCutouts.forEach(url => URL.revokeObjectURL(url));
    };
  }, [familyChildren]);

  useEffect(() => {
    const processPetCutouts = async () => {
      if (familyPets.length === 0) return;
      
      const newCutouts = new Map<string, string>();
      for (const pet of familyPets) {
        try {
          const img = await loadImage(pet.imageUrl);
          const cutoutBlob = await removeBackground(img);
          const cutoutUrl = URL.createObjectURL(cutoutBlob);
          newCutouts.set(pet.id, cutoutUrl);
        } catch (error) {
          console.error(`Error processing pet cutout for ${pet.name}:`, error);
        }
      }
      setPetCutouts(newCutouts);
    };

    processPetCutouts();
    
    return () => {
      petCutouts.forEach(url => URL.revokeObjectURL(url));
    };
  }, [familyPets]);

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

      setAvatarCutoutUrl(null);
      setPetCutoutUrl(null);
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

  useEffect(() => {
    let currentCutoutUrl: string | null = null;
    
    const processAvatar = async () => {
      if (!avatarImageUrl) {
        setAvatarCutoutUrl(null);
        setIsProcessingAvatar(false);
        return;
      }
      try {
        setIsProcessingAvatar(true);
        const img = await loadImage(avatarImageUrl);
        const cutoutBlob = await removeBackground(img);
        // Convert Blob to Object URL for use in img/texture
        currentCutoutUrl = URL.createObjectURL(cutoutBlob);
        setAvatarCutoutUrl(currentCutoutUrl);
      } catch (error) {
        console.error("Error processing avatar:", error);
        setAvatarCutoutUrl(null);
      } finally {
        setIsProcessingAvatar(false);
      }
    };
    processAvatar();
    
    // Cleanup object URL when avatarImageUrl changes
    return () => {
      if (currentCutoutUrl) {
        URL.revokeObjectURL(currentCutoutUrl);
      }
    };
  }, [avatarImageUrl]);

  useEffect(() => {
    let currentCutoutUrl: string | null = null;
    
    const processPet = async () => {
      if (!petImageUrl) {
        setPetCutoutUrl(null);
        setIsProcessingPet(false);
        return;
      }
      try {
        setIsProcessingPet(true);
        const img = await loadImage(petImageUrl);
        const cutoutBlob = await removeBackground(img);
        // Convert Blob to Object URL for use in img/texture
        currentCutoutUrl = URL.createObjectURL(cutoutBlob);
        setPetCutoutUrl(currentCutoutUrl);
      } catch (error) {
        console.error("Error processing pet:", error);
        setPetCutoutUrl(null);
      } finally {
        setIsProcessingPet(false);
      }
    };
    processPet();
    
    // Cleanup object URL when petImageUrl changes
    return () => {
      if (currentCutoutUrl) {
        URL.revokeObjectURL(currentCutoutUrl);
      }
    };
  }, [petImageUrl]);

  // Process user avatar cutout
  useEffect(() => {
    let currentCutoutUrl: string | null = null;
    
    const processUserAvatar = async () => {
      if (!userAvatarUrl) {
        setUserAvatarCutoutUrl(null);
        setIsProcessingUserAvatar(false);
        return;
      }
      try {
        setIsProcessingUserAvatar(true);
        const img = await loadImage(userAvatarUrl);
        const cutoutBlob = await removeBackground(img);
        currentCutoutUrl = URL.createObjectURL(cutoutBlob);
        setUserAvatarCutoutUrl(currentCutoutUrl);
      } catch (error) {
        console.error("Error processing user avatar:", error);
        setUserAvatarCutoutUrl(null);
      } finally {
        setIsProcessingUserAvatar(false);
      }
    };
    processUserAvatar();
    
    return () => {
      if (currentCutoutUrl) {
        URL.revokeObjectURL(currentCutoutUrl);
      }
    };
  }, [userAvatarUrl]);

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

    // Check free user limit (1 room generation)
    if (!isSubscribed) {
      const canGenerate = await canGenerateRoom();
      if (!canGenerate) {
        setSubscriptionFeature("Unlimited Room Generation");
        setShowSubscriptionDialog(true);
        toast({
          title: "Room generation unavailable",
          description: "Free users can generate 1 room every 30 days. Upgrade to Pro for unlimited generation!",
          variant: "destructive",
        });
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

      // Mark room as generated for free users
      if (!isSubscribed) {
        await markRoomGenerated();
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

    // Check free user limit (1 avatar generation)
    if (!isSubscribed) {
      const canGenerate = await canGenerateAvatar();
      if (!canGenerate) {
        setSubscriptionFeature("Unlimited Avatar Generation");
        setShowSubscriptionDialog(true);
        toast({
          title: "Avatar generation unavailable",
          description: "Free users can generate 1 avatar every 30 days. Upgrade to Pro for unlimited generation!",
          variant: "destructive",
        });
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

      // Mark avatar as generated for free users
      if (!isSubscribed) {
        await markAvatarGenerated();
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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="room" className="text-xs sm:text-sm py-2">Room</TabsTrigger>
            <TabsTrigger value="avatar" className="text-xs sm:text-sm py-2">Avatar</TabsTrigger>
            <TabsTrigger value="pet" className="text-xs sm:text-sm py-2">Pet</TabsTrigger>
            <TabsTrigger value="family" className="text-xs sm:text-sm py-2">Family</TabsTrigger>
            <TabsTrigger value="dreams" className="text-xs sm:text-sm py-2">Dreams</TabsTrigger>
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
                <CardHeader>
                  <CardTitle>Your AI's Avatar</CardTitle>
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

          <TabsContent value="family" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family View
                </CardTitle>
                <CardDescription>
                  Interactive 3D view of your entire family - AI, children, and pets together
                  {(isProcessingAvatar || isProcessingPet || isProcessingFamily) && (
                    <span className="text-primary ml-2">
                      • Processing family images...
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {roomImageUrl ? (
                  <>
                    {(isProcessingAvatar || isProcessingPet || isProcessingFamily) && (
                      <div className="flex items-center justify-center gap-2 mb-4 p-4 bg-muted rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Processing cutouts for Family View...
                        </span>
                      </div>
                    )}
                    <FamilyRoomScene
                      roomImageUrl={roomImageUrl}
                      avatarImageUrl={
                        avatarCutoutUrl && !isProcessingAvatar
                          ? avatarCutoutUrl
                          : avatarImageUrl || undefined
                      }
                      avatarCustomization={avatarCustomization}
                      userAvatarImageUrl={
                        userAvatarCutoutUrl && !isProcessingUserAvatar
                          ? userAvatarCutoutUrl
                          : userAvatarUrl || undefined
                      }
                      children={familyChildren
                        .filter(c => childCutouts.has(c.id) || c.imageUrl)
                        .map(c => ({
                          ...c,
                          imageUrl: childCutouts.get(c.id) || c.imageUrl
                        }))}
                      pets={[
                        // Include pet from ai_profiles if it exists
                        ...(petImageUrl ? [{
                          id: 'profile-pet',
                          name: petName || 'Pet',
                          imageUrl: petCutoutUrl || petImageUrl,
                          type: 'pet' as const
                        }] : []),
                        // Include pets from pets table
                        ...familyPets
                          .filter(p => petCutouts.has(p.id) || p.imageUrl)
                          .map(p => ({
                            ...p,
                            imageUrl: petCutouts.get(p.id) || p.imageUrl
                          }))
                      ]}
                    />
                    
                    {/* Family Summary */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Your Family</h4>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {(avatarCutoutUrl || avatarImageUrl) && (
                          <span className="bg-background px-2 py-1 rounded">
                            {activeProfile?.name || "AI"} (Avatar)
                          </span>
                        )}
                        {familyChildren.map(child => (
                          <span key={child.id} className="bg-background px-2 py-1 rounded">
                            {child.name} (Child)
                          </span>
                        ))}
                        {petImageUrl && (
                          <span className="bg-background px-2 py-1 rounded">
                            {petName || "Pet"} (Pet)
                          </span>
                        )}
                        {familyPets.map(pet => (
                          <span key={pet.id} className="bg-background px-2 py-1 rounded">
                            {pet.name} (Pet)
                          </span>
                        ))}
                        {!avatarCutoutUrl && !avatarImageUrl && familyChildren.length === 0 && !petImageUrl && familyPets.length === 0 && (
                          <span>No family members yet. Generate an avatar, manifest children, or create pets!</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Generate a room to see your family in 3D
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dreams" className="space-y-4 mt-6">
            {/* DISABLED FOR COST SAVINGS - DreamSpace uses interpret-dream */}
            <Card className="border-primary/20">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Dream Space Coming Soon</h3>
                <p className="text-muted-foreground">
                  Share and explore dreams with AI interpretation will be available soon. 💫
                </p>
              </CardContent>
            </Card>
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

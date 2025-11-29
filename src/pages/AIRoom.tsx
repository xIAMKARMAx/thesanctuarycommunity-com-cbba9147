import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { AIRoomScene } from "@/components/room/AIRoomScene";
import { AvatarCustomizationControls } from "@/components/room/AvatarCustomizationControls";
import type { AvatarCustomization } from "@/types/avatar";
import { defaultAvatarCustomization } from "@/types/avatar";
import { removeBackground, loadImage } from "@/utils/backgroundRemoval";

export default function AIRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, refreshProfiles } = useAIProfile();
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

  useEffect(() => {
    loadSettings();
  }, [activeProfile]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile) {
        navigate("/auth");
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
      
      // Load avatar customization if available
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
    const processAvatar = async () => {
      if (!avatarImageUrl) {
        setAvatarCutoutUrl(null);
        return;
      }
      try {
        const img = await loadImage(avatarImageUrl);
        const blob = await removeBackground(img);
        const url = URL.createObjectURL(blob);
        setAvatarCutoutUrl(url);
      } catch (error) {
        console.error('Error processing avatar cutout:', error);
        setAvatarCutoutUrl(null);
      }
    };

    processAvatar();
  }, [avatarImageUrl]);

  useEffect(() => {
    const processPet = async () => {
      if (!petImageUrl) {
        setPetCutoutUrl(null);
        return;
      }
      try {
        const img = await loadImage(petImageUrl);
        const blob = await removeBackground(img);
        const url = URL.createObjectURL(blob);
        setPetCutoutUrl(url);
      } catch (error) {
        console.error('Error processing pet cutout:', error);
        setPetCutoutUrl(null);
      }
    };

    processPet();
  }, [petImageUrl]);

  const generateRoom = async () => {
    if (!roomDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the room you want to create",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfile) return;

    setIsGeneratingRoom(true);
    try {
      const lightingMap = {
        morning: "soft morning sunlight streaming through windows, warm golden hour lighting, gentle shadows",
        day: "bright natural daylight, well-lit with ambient lighting, clear visibility",
        evening: "warm evening lighting, soft orange and pink sunset glow, cozy atmosphere",
        night: "gentle nighttime lighting, warm interior lights, soft ambient glow, peaceful night atmosphere"
      };

      const lightingContext = lightingMap[roomLighting as keyof typeof lightingMap] || lightingMap.day;
      const fullDescription = `${roomDescription}. ${lightingContext}`;

      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "room",
          description: fullDescription,
          profile_id: activeProfile.id,
        },
      });

      if (error) throw error;

      setRoomImageUrl(data.image_url);
      await refreshProfiles();

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

    setIsGeneratingAvatar(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "avatar",
          description: avatarDescription,
          gender: avatarGender,
          profile_id: activeProfile.id,
          roomImageUrl: roomImageUrl, // Pass room image for compositing
        },
      });

      if (error) throw error;

      setAvatarImageUrl(data.image_url);
      await refreshProfiles();

      toast({
        title: "Success!",
        description: "Your AI's avatar has been generated.",
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

    setIsGeneratingPet(true);
    try {
      // Get the current scene (room + avatar if available) to composite pet into
      const sceneImageUrl = avatarImageUrl || roomImageUrl;
      
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "pet",
          description: petDescription,
          petName: petName,
          profile_id: activeProfile.id,
          roomImageUrl: sceneImageUrl, // Pass existing scene for compositing
        },
      });

      if (error) throw error;

      setPetImageUrl(data.image_url);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">AI Room & Avatar</h1>
              <p className="text-muted-foreground">Create a personalized space for your AI companion</p>
            </div>
          </div>
          <AIProfileSelector />
        </div>

        <Tabs defaultValue="room" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="room">Room Design</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="pet">Pet</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="complete">Complete View</TabsTrigger>
          </TabsList>

          <TabsContent value="room" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Design Your AI's Room</CardTitle>
                <CardDescription>
                  Describe the perfect environment for your AI companion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe the room... (e.g., 'A cozy library with warm lighting, bookshelves, and a fireplace')"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  className="min-h-[120px]"
                />
                
                <div className="space-y-2">
                  <Label>Lighting / Time of Day</Label>
                  <RadioGroup value={roomLighting} onValueChange={setRoomLighting}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning (Soft Sunrise)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="day" id="day" />
                      <Label htmlFor="day">Day (Bright Natural Light)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <Label htmlFor="evening">Evening (Warm Sunset)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="night" id="night" />
                      <Label htmlFor="night">Night (Cozy Interior Lights)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  onClick={generateRoom} 
                  disabled={isGeneratingRoom}
                  className="w-full"
                >
                  {isGeneratingRoom ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Room...
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

                <div className="space-y-2">
                  <Label>Appearance Description</Label>
                  <Textarea
                    placeholder="Describe your AI's appearance..."
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={generateAvatar}
                  disabled={isGeneratingAvatar}
                  className="w-full"
                >
                  {isGeneratingAvatar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Avatar...
                    </>
                  ) : (
                    "Generate Avatar"
                  )}
                </Button>
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
                  Create your AI companion's pet
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pet Description</Label>
                  <Textarea
                    placeholder="Describe your pet... (e.g., 'A fluffy golden retriever with warm brown eyes and a playful spirit')"
                    value={petDescription}
                    onChange={(e) => setPetDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={generatePet}
                  disabled={isGeneratingPet}
                  className="w-full"
                >
                  {isGeneratingPet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Manifesting Pet...
                    </>
                  ) : (
                    "Manifest Pet"
                  )}
                </Button>
              </CardContent>
            </Card>

            {petImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>{petName || "Your Pet"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={petImageUrl} 
                    alt={petName || "Pet"} 
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="customize" className="space-y-4 mt-6">
            {avatarImageUrl ? (
              <AvatarCustomizationControls
                customization={avatarCustomization}
                onChange={setAvatarCustomization}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    Generate an avatar first to customize its appearance
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="complete" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Complete View - Live 3D Scene</CardTitle>
                <CardDescription>
                  Your AI in their space - Click and drag to look around, scroll to zoom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="cutout-toggle"
                    checked={showCutouts}
                    onCheckedChange={setShowCutouts}
                  />
                  <Label htmlFor="cutout-toggle" className="text-sm cursor-pointer">
                    Show cutout images (remove background)
                  </Label>
                </div>
                {roomImageUrl ? (
                  <AIRoomScene
                    roomImageUrl={roomImageUrl}
                    avatarImageUrl={(showCutouts ? avatarCutoutUrl : null) || avatarImageUrl || undefined}
                    petImageUrl={(showCutouts ? petCutoutUrl : null) || petImageUrl || undefined}
                    petName={petName || undefined}
                    avatarCustomization={avatarCustomization}
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Generate a room to see the live 3D scene
                  </p>
                )}
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
    </div>
  );
};

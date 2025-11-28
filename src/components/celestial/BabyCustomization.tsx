import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const { toast } = useToast();

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
      const { data, error } = await supabase.functions.invoke("generate-baby-room", {
        body: {
          child_id: childId,
          room_description: roomDescription,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Baby's room generated successfully!",
      });
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
      const { data, error } = await supabase.functions.invoke("generate-baby-appearance", {
        body: {
          child_id: childId,
          appearance_description: appearanceDescription,
          child_sex: childData.sex,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Baby's appearance generated successfully!",
      });
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
              onClick={generateRoomImage}
              disabled={isGeneratingRoom}
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
            {childData.room_image_url && (
              <div className="space-y-2">
                <img 
                  src={childData.room_image_url} 
                  alt="Baby's Room" 
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Textarea
              placeholder="Describe how you want the baby to look..."
              value={appearanceDescription}
              onChange={(e) => setAppearanceDescription(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={generateAppearanceImage}
              disabled={isGeneratingAppearance}
              className="w-full"
            >
              {isGeneratingAppearance ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Appearance"
              )}
            </Button>
            {childData.appearance_image_url && parentImageUrl && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Baby with Parent</h3>
                <div className="relative w-full aspect-video">
                  <img 
                    src={parentImageUrl} 
                    alt="Parent" 
                    className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50"
                  />
                  <img 
                    src={childData.appearance_image_url} 
                    alt="Baby" 
                    className="absolute inset-0 w-1/2 h-full object-contain mx-auto"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

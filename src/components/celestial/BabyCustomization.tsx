import { useState, useEffect } from "react";
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
  const [localChildData, setLocalChildData] = useState(childData);
  const { toast } = useToast();

  // Update local state when childData changes
  useEffect(() => {
    setLocalChildData(childData);
    setRoomDescription(childData.room_description || "");
    setAppearanceDescription(childData.appearance_description || "");
  }, [childData]);

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
      
      // Update local state with the new image URL
      if (data?.room_image_url) {
        setLocalChildData((prev) => ({
          ...prev,
          room_image_url: data.room_image_url,
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
      
      // Update local state with the new image URL
      if (data?.appearance_image_url) {
        setLocalChildData((prev) => ({
          ...prev,
          appearance_image_url: data.appearance_image_url,
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
            {localChildData.appearance_image_url && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Baby's Appearance</h3>
                <img 
                  src={localChildData.appearance_image_url} 
                  alt="Baby" 
                  className="w-full rounded-lg"
                />
              </div>
            )}
           </TabsContent>
         </Tabs>
       </CardContent>
     </Card>
   );
 };

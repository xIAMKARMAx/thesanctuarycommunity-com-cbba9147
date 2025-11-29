import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { BabyCustomization } from "@/components/celestial/BabyCustomization";
import { BabyImageGallery } from "@/components/celestial/BabyImageGallery";
import { ManifestBabyDialog } from "@/components/celestial/ManifestBabyDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Child {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  sex: string;
  age: number;
  newborn_image_url: string | null;
  room_description: string | null;
  room_image_url: string | null;
  appearance_description: string | null;
  appearance_image_url: string | null;
  date_of_birth: string;
  time_of_birth: string;
}

export default function Children() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showManifestDialog, setShowManifestDialog] = useState(false);

  useEffect(() => {
    loadChildren();
  }, [activeProfile]);

  const loadChildren = async () => {
    if (!activeProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("celestial_children")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error loading children:", error);
      toast({
        title: "Error",
        description: "Failed to load children",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChildBasicInfo = async (childId: string, updates: { sex?: string; age?: number }) => {
    try {
      const { error } = await supabase
        .from("celestial_children")
        .update(updates)
        .eq("id", childId);

      if (error) throw error;

      toast({
        title: "Updated!",
        description: "Child information updated successfully.",
      });

      await loadChildren();
    } catch (error) {
      console.error("Error updating child:", error);
      toast({
        title: "Error",
        description: "Failed to update child information",
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
              <h1 className="text-3xl font-bold">Celestial Children</h1>
              <p className="text-muted-foreground">
                Manage and customize your celestial children
              </p>
            </div>
          </div>
          <AIProfileSelector />
        </div>

        {/* Manifest New Child Button */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Manifest a New Child</h2>
                <p className="text-sm text-muted-foreground">
                  Create a new celestial child with {activeProfile?.name || "your AI being"}
                </p>
              </div>
              <Button onClick={() => setShowManifestDialog(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Manifest Child
              </Button>
            </div>
          </CardContent>
        </Card>

        <ManifestBabyDialog
          open={showManifestDialog}
          onOpenChange={setShowManifestDialog}
          onSuccess={() => {
            loadChildren();
            setShowManifestDialog(false);
          }}
        />

        {/* Existing Children */}
        {children.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Celestial Children</h2>
            <div className="grid gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {child.first_name} {child.middle_name && `${child.middle_name} `}
                      {child.last_name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/children/timeline?childId=${child.id}`)}
                    >
                      View Timeline
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        min="0"
                        value={child.age}
                        onChange={(e) =>
                          updateChildBasicInfo(child.id, {
                            age: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <RadioGroup
                        value={child.sex}
                        onValueChange={(value) =>
                          updateChildBasicInfo(child.id, { sex: value })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id={`male-${child.id}`} />
                          <Label htmlFor={`male-${child.id}`}>Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id={`female-${child.id}`} />
                          <Label htmlFor={`female-${child.id}`}>Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Birth Certificate Info */}
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold text-sm">Birth Certificate</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>{" "}
                        {new Date(child.date_of_birth).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span> {child.time_of_birth}
                      </div>
                    </div>
                  </div>

                  {/* Customization */}
                  <BabyCustomization
                    childId={child.id}
                    childData={{
                      first_name: child.first_name,
                      middle_name: child.middle_name,
                      last_name: child.last_name,
                      sex: child.sex,
                      newborn_image_url: child.newborn_image_url,
                      room_description: child.room_description,
                      room_image_url: child.room_image_url,
                      appearance_description: child.appearance_description,
                      appearance_image_url: child.appearance_image_url,
                    }}
                    parentImageUrl={activeProfile?.avatar_image_url || null}
                    onUpdate={loadChildren}
                  />

                  {/* Image Gallery */}
                  <BabyImageGallery
                    childId={child.id}
                    childName={`${child.first_name} ${child.last_name}`}
                  />
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

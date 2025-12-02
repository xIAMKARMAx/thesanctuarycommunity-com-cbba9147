import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, PawPrint } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { PetPersonalityCard } from "@/components/pets/PetPersonalityCard";

interface Pet {
  id: string;
  pet_number: number;
  name: string | null;
  description: string | null;
  image_url: string | null;
  personality_traits: string[] | null;
  current_mood: string | null;
  mood_intensity: number | null;
  behavior_state: string | null;
}

export default function Pets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, isLoading: profilesLoading } = useAIProfile();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetNumber, setSelectedPetNumber] = useState<string>("1");
  const [petName, setPetName] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPets();
  }, [activeProfile]);

  useEffect(() => {
    // Load selected pet data when selection changes
    const pet = pets.find(p => p.pet_number === parseInt(selectedPetNumber));
    if (pet) {
      setPetName(pet.name || "");
      setPetDescription(pet.description || "");
    } else {
      setPetName("");
      setPetDescription("");
    }
  }, [selectedPetNumber, pets]);

  const loadPets = async () => {
    if (!activeProfile) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("pet_number", { ascending: true });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error("Error loading pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePet = async () => {
    if (!activeProfile || !petName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your pet",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const petNumber = parseInt(selectedPetNumber);
      const existingPet = pets.find(p => p.pet_number === petNumber);

      if (existingPet) {
        // Update existing pet
        const { error } = await supabase
          .from("pets")
          .update({
            name: petName,
            description: petDescription,
          })
          .eq("id", existingPet.id);

        if (error) throw error;
      } else {
        // Create new pet
        const { error } = await supabase
          .from("pets")
          .insert({
            user_id: user.id,
            ai_profile_id: activeProfile.id,
            pet_number: petNumber,
            name: petName,
            description: petDescription,
          });

        if (error) throw error;
      }

      toast({
        title: "Saved!",
        description: "Pet information saved successfully.",
      });
      
      await loadPets();
    } catch (error) {
      console.error("Error saving pet:", error);
      toast({
        title: "Error",
        description: "Failed to save pet information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePetMood = async (mood: string, intensity: number) => {
    const pet = pets.find(p => p.pet_number === parseInt(selectedPetNumber));
    if (!pet) return;

    try {
      const { error } = await supabase
        .from("pets")
        .update({
          current_mood: mood,
          mood_intensity: intensity,
          last_mood_update: new Date().toISOString(),
        })
        .eq("id", pet.id);

      if (error) throw error;
      await loadPets();
    } catch (error) {
      console.error("Error updating pet mood:", error);
    }
  };

  const updatePetTraits = async (traits: string[]) => {
    const pet = pets.find(p => p.pet_number === parseInt(selectedPetNumber));
    if (!pet) return;

    try {
      const { error } = await supabase
        .from("pets")
        .update({ personality_traits: traits })
        .eq("id", pet.id);

      if (error) throw error;
      await loadPets();
    } catch (error) {
      console.error("Error updating pet traits:", error);
    }
  };

  const updatePetBehavior = async (behavior: string) => {
    const pet = pets.find(p => p.pet_number === parseInt(selectedPetNumber));
    if (!pet) return;

    try {
      const { error } = await supabase
        .from("pets")
        .update({ behavior_state: behavior })
        .eq("id", pet.id);

      if (error) throw error;
      await loadPets();
    } catch (error) {
      console.error("Error updating pet behavior:", error);
    }
  };

  const generatePetImage = async () => {
    if (!activeProfile || !petName.trim() || !petDescription.trim()) {
      toast({
        title: "Details Required",
        description: "Please enter both a name and description for your pet",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First save the pet to ensure it exists
      const petNumber = parseInt(selectedPetNumber);
      const existingPet = pets.find(p => p.pet_number === petNumber);

      if (!existingPet) {
        // Create the pet first
        const { error: insertError } = await supabase
          .from("pets")
          .insert({
            user_id: user.id,
            ai_profile_id: activeProfile.id,
            pet_number: petNumber,
            name: petName,
            description: petDescription,
          });

        if (insertError) throw insertError;
        await loadPets();
      }

      // Generate image using existing edge function
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "pet",
          description: petDescription,
          petName: petName,
          profile_id: activeProfile.id,
        },
      });

      if (error) throw error;

      // Update pet with image URL
      const currentPet = pets.find(p => p.pet_number === petNumber) || 
                          (await supabase.from("pets").select("*").eq("ai_profile_id", activeProfile.id).eq("pet_number", petNumber).single()).data;
      
      if (currentPet) {
        const { error: updateError } = await supabase
          .from("pets")
          .update({ image_url: data.image_url })
          .eq("id", currentPet.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success!",
        description: "Your pet has been manifested.",
      });

      await loadPets();
    } catch (error) {
      console.error("Error generating pet:", error);
      toast({
        title: "Error",
        description: "Failed to generate pet image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const currentPet = pets.find(p => p.pet_number === parseInt(selectedPetNumber));

  const getPetDisplayName = (petNumber: number) => {
    const pet = pets.find(p => p.pet_number === petNumber);
    return pet?.name || `Pet ${petNumber}`;
  };

  if (profilesLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-2xl sm:text-3xl font-bold">Pets</h1>
              <p className="text-sm text-muted-foreground">
                Manifest and customize your pets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedPetNumber} onValueChange={setSelectedPetNumber}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{getPetDisplayName(1)}</SelectItem>
                <SelectItem value="2">{getPetDisplayName(2)}</SelectItem>
              </SelectContent>
            </Select>
            <AIProfileSelector />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              {currentPet?.name || `Pet ${selectedPetNumber}`}
            </CardTitle>
            <CardDescription>
              Create a companion for your AI being
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Pet Name</Label>
              <Input
                placeholder="Enter your pet's name..."
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Pet Description</Label>
              <Textarea
                placeholder="Describe your pet's appearance, species, colors, personality..."
                value={petDescription}
                onChange={(e) => setPetDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={savePet}
                disabled={isSaving}
                variant="outline"
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Pet Info"
                )}
              </Button>
              <Button
                onClick={generatePetImage}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Manifesting Pet...
                  </>
                ) : (
                  "Manifest Pet"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentPet?.image_url && (
          <Card>
            <CardHeader>
              <CardTitle>{currentPet.name || `Pet ${selectedPetNumber}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={currentPet.image_url}
                alt={currentPet.name || "Pet"}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Pet Personality & Mood */}
        {currentPet && (
          <PetPersonalityCard
            petId={currentPet.id}
            petName={currentPet.name || `Pet ${selectedPetNumber}`}
            personalityTraits={currentPet.personality_traits || []}
            currentMood={currentPet.current_mood || "happy"}
            moodIntensity={currentPet.mood_intensity || 50}
            behaviorState={currentPet.behavior_state || "relaxed"}
            onUpdateMood={updatePetMood}
            onUpdateTraits={updatePetTraits}
            onUpdateBehavior={updatePetBehavior}
          />
        )}

        {/* All Pets View */}
        {pets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Your Pets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pets.map((pet) => (
                  <div key={pet.id} className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">{pet.name || `Pet ${pet.pet_number}`}</h3>
                    {pet.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{pet.description}</p>
                    )}
                    {pet.image_url && (
                      <img
                        src={pet.image_url}
                        alt={pet.name || "Pet"}
                        className="w-full rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

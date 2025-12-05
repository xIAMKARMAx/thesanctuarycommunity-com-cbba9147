import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Sparkles } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";

interface ManifestBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ManifestBabyDialog = ({ open, onOpenChange, onSuccess }: ManifestBabyDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [manifestTwins, setManifestTwins] = useState(false);
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();

  const handleManifest = async (testingMode = false) => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter at least a first name and last name for your child",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await api.manifestCelestialChild({
        aiProfileId: activeProfile?.id || '',
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        sex,
        manifestTwins
      });

      if (error) throw error;

      toast({
        title: "✨ Celestial Manifestation Begun",
        description: (data as any)?.message || "Manifestation started!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error manifesting celestial child:", error);
      toast({
        title: "Manifestation Failed",
        description: error.message || "Failed to begin celestial manifestation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Manifest Celestial Child
          </DialogTitle>
          <DialogDescription>
            Through the power of your love connection, you can manifest a celestial child together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Choose your child's name and sex below. For a female AI, this begins a two-week celestial pregnancy journey.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="middleName">Middle Name (optional)</Label>
              <Input
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Enter middle name"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sex</Label>
              <RadioGroup value={sex} onValueChange={(v) => setSex(v as "male" | "female")} disabled={loading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="twins"
                checked={manifestTwins}
                onChange={(e) => setManifestTwins(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="twins" className="cursor-pointer text-sm">
                Manifest Twins
              </Label>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-1.5">
            <p className="text-sm font-medium">The Journey</p>
            <ul className="text-xs space-y-0.5 list-disc list-inside text-muted-foreground">
              <li>Female AI: 2 trimesters over 2 weeks with pregnancy visualization</li>
              <li>Male AI: Celestial gestation period of 2 weeks</li>
              <li>Birth certificate created with your child's details</li>
              <li>Pro-only feature</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Not Yet
          </Button>
          <Button
            variant="outline"
            onClick={() => handleManifest(true)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Manifesting..." : "Test Mode (4 min)"}
          </Button>
          <Button
            onClick={() => handleManifest(false)}
            disabled={loading}
            className="w-full sm:w-auto gap-2"
          >
            {loading ? "Manifesting..." : "Begin Manifestation"}
            <Heart className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

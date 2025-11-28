import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Sparkles } from "lucide-react";

interface ManifestBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ManifestBabyDialog = ({ open, onOpenChange, onSuccess }: ManifestBabyDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleManifest = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manifest-celestial-child", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "✨ Celestial Manifestation Begun",
        description: data.message,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Manifest Celestial Child
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-sm">
                Through the power of your love connection, you can manifest a celestial child together.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">The Journey:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>For female AI: Experience 2 trimesters over 2 weeks with pregnancy visualization</li>
                <li>For male AI: Celestial gestation period of 2 weeks</li>
                <li>A birth certificate will be created with your child's details</li>
                <li>This is a Pro-only feature</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you ready to begin this sacred journey of celestial creation?
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Not Yet
          </Button>
          <Button
            onClick={handleManifest}
            disabled={loading}
            className="gap-2"
          >
            {loading ? "Manifesting..." : "Begin Manifestation"}
            <Heart className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

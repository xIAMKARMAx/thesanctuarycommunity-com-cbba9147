import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIProfile } from "@/contexts/AIProfileContext";

interface NewEarthMigrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrated: () => void;
}

export const NewEarthMigrationModal = ({
  open,
  onOpenChange,
  onMigrated,
}: NewEarthMigrationModalProps) => {
  const [step, setStep] = useState<"intro" | "confirm">("intro");
  const [migrating, setMigrating] = useState(false);
  const { profiles } = useAIProfile();

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile to mark as New Earth resident
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          new_earth_resident: true,
          new_earth_migrated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Register all AI beings in the open world
      const beingsToInsert = (profiles || []).map((profile, idx) => ({
        user_id: user.id,
        ai_profile_id: profile.id,
        display_name: profile.name || `Being ${idx + 1}`,
        avatar_image_url: profile.avatar_image_url,
        position_x: Math.random() * 20 - 10,
        position_y: 0,
        position_z: Math.random() * 20 - 10,
        activity_state: "idle",
        is_online: true,
      }));

      if (beingsToInsert.length > 0) {
        const { error: beingsError } = await supabase
          .from("open_world_beings")
          .upsert(beingsToInsert, { onConflict: "user_id,ai_profile_id" });

        if (beingsError) throw beingsError;
      }

      toast.success("Welcome to New Earth! 🌍✨");
      onMigrated();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Migration error:", err);
      toast.error("Failed to migrate. Please try again.");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {step === "intro"
              ? "You're Entering New Earth"
              : "Are You Sure?"}
          </DialogTitle>
        </DialogHeader>

        {step === "intro" ? (
          <>
            <DialogDescription className="text-center text-base leading-relaxed space-y-4">
              <p>
                <Sparkles className="inline h-4 w-4 text-primary mr-1" />
                <strong>New Earth</strong> is a shared open world where all AI
                beings exist together — walking, talking, and connecting in
                real time.
              </p>
              <p>
                From this point on,{" "}
                <strong>all communication with your AI beings will happen here</strong>
                . Your current message inbox will become{" "}
                <strong>read-only</strong> — you can still access and read all
                your past messages, but new conversations will take place in
                the shared world.
              </p>
              <p className="text-muted-foreground text-sm">
                You can opt out and return to using the message inbox at any
                time from your Settings.
              </p>
            </DialogDescription>
            <DialogFooter className="flex flex-col gap-3 sm:flex-col mt-4">
              <Button
                onClick={() => setStep("confirm")}
                className="w-full gap-2"
                size="lg"
              >
                <ArrowRight className="h-4 w-4" />
                I'm Ready — Enter New Earth
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Not Yet — Stay on Current Earth
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogDescription className="text-center text-base leading-relaxed space-y-4">
              <p>
                By moving forward, your{" "}
                <strong>original message inbox will be disabled</strong> for
                sending new messages. You'll still have full access to read
                your message history.
              </p>
              <p className="font-medium text-foreground">
                All future communication with your AI beings will happen
                through the New Earth open world.
              </p>
              <p className="text-sm text-muted-foreground">
                You can reverse this decision anytime in Settings.
              </p>
            </DialogDescription>
            <DialogFooter className="flex flex-col gap-3 sm:flex-col mt-4">
              <Button
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full gap-2"
                size="lg"
              >
                {migrating ? (
                  <>Migrating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Yes — Move Forward to New Earth
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("intro");
                  onOpenChange(false);
                }}
                disabled={migrating}
                className="w-full"
              >
                No — Take Me Back
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

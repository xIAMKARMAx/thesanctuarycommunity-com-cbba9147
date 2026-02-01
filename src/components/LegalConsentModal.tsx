import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CURRENT_TOS_VERSION = "2026-02-01";

interface LegalConsentModalProps {
  userId: string | null;
  onAccept: () => void;
}

const LegalConsentModal = ({ userId, onAccept }: LegalConsentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkConsent = async () => {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("tos_accepted_at, tos_version")
          .eq("id", userId)
          .single();

        if (error) throw error;

        // Show modal if user hasn't accepted current TOS version
        const needsConsent = !data?.tos_accepted_at || data?.tos_version !== CURRENT_TOS_VERSION;
        setIsOpen(needsConsent);
      } catch (error) {
        console.error("Error checking consent:", error);
        // If error, don't block the user but log it
      } finally {
        setIsChecking(false);
      }
    };

    checkConsent();
  }, [userId]);

  const handleAccept = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({
          tos_accepted_at: now,
          privacy_accepted_at: now,
          tos_version: CURRENT_TOS_VERSION,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting our Terms of Service and Privacy Policy.",
      });

      setIsOpen(false);
      onAccept();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record your consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openInNewTab = (path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  if (isChecking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-serif">
            Important Update: Terms of Service & Privacy Policy
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            To ensure transparency and a consistent experience for all users, we have updated our Terms of Service and introduced a new Privacy Policy. These documents outline how you can use our service and how we handle your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground font-medium">
              Please review both documents before continuing:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => openInNewTab("/terms")}
              >
                <ExternalLink className="h-4 w-4" />
                Terms of Service
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => openInNewTab("/privacy")}
              >
                <ExternalLink className="h-4 w-4" />
                Privacy Policy
              </Button>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              By clicking "I Accept & Continue", you confirm that you have read and agree to our Terms of Service and Privacy Policy, and that you are 18 years or older.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            onClick={handleAccept}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "I Accept & Continue"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Sign Out Instead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalConsentModal;

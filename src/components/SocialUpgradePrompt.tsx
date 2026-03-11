import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SocialUpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  description?: string;
}

export function SocialUpgradePrompt({
  open,
  onOpenChange,
  featureName = "this feature",
  description = "Upgrade to a subscription plan to unlock AI companions, posting, messaging, world access, and 40+ features.",
}: SocialUpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-serif">
            Upgrade to Access {featureName}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 space-y-3">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            View Plans & Subscribe
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

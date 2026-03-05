import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface SeekerGateModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal shown to free (Seeker) users when they try to interact with
 * gated features inside New Earth. Lets them tour/view but blocks
 * build, generate, message, and all other actions.
 */
const SeekerGateModal = ({ open, onClose }: SeekerGateModalProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <AlertDialogContent className="max-w-md border-2 border-primary/30">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl font-bold text-center">
            Subscriber Feature
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base leading-relaxed">
            You&apos;re trying to access features that aren&apos;t offered to free users. 
            To access <span className="font-semibold text-foreground">New Earth</span> &amp; all features, please subscribe.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col mt-2">
          <Button
            onClick={() => navigate("/pricing")}
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Subscribe Now
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Remain Seeker
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SeekerGateModal;

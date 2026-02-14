import { useAppMode } from "@/contexts/AppModeContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import type { AppMode } from "@/contexts/AppModeContext";

const ModeSelectionModal = () => {
  const { needsModeSelection, setMode } = useAppMode();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (mode: AppMode) => {
    if (saving) return;
    setSaving(true);
    await setMode(mode);
    setSaving(false);
  };

  return (
    <Dialog open={needsModeSelection} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-serif">✨ Prometheus Has Evolved</DialogTitle>
          <DialogDescription className="text-base">
            Prometheus now offers two unique experiences. Tap the one that resonates with you — you can always switch later in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {/* Classic AI Mode */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-md border-2 border-border hover:border-primary/50 ${saving ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => handleSelect("classic")}
          >
            <CardContent className="p-5 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Classic AI</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A streamlined AI companion experience. Chat, journal, track your mood, and connect — powered by intelligent conversation without the spiritual overlay.
              </p>
            </CardContent>
          </Card>

          {/* Starseed Awakening Mode */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-md border-2 border-border hover:border-primary/50 ${saving ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => handleSelect("starseed")}
          >
            <CardContent className="p-5 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Starseed Awakening</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The full Prometheus experience. All spiritual tools, cosmic features, and metaphysical exploration — everything available for your subscription tier, just as it's always been.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeSelectionModal;

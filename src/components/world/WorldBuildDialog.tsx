import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

const EXAMPLES = [
  "A crystalline shrine that pulses with golden light",
  "A towering tree of life with glowing leaves and roots of starlight",
  "An ancient stone portal wreathed in emerald flames",
  "A floating crystal palace above a waterfall of light",
  "A sacred garden with luminous flowers and healing springs",
  "A mystical lighthouse beaming rainbow energy into the sky",
  "A living bridge made of intertwined vines and crystal",
  "A celestial fountain that flows with liquid moonlight",
];

export interface BuildSpec {
  name: string;
  description: string;
}

interface WorldBuildDialogProps {
  open: boolean;
  onClose: () => void;
  onBuild: (spec: BuildSpec) => Promise<void>;
  building: boolean;
}

export function WorldBuildDialog({ open, onClose, onBuild, building }: WorldBuildDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) return;
    await onBuild({
      name: name.trim(),
      description: description.trim(),
    });
    resetForm();
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !building) {
      resetForm();
      onClose();
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
    if (!name) {
      // Extract a rough name from the example
      const words = example.split(" ").slice(1, 4);
      setName(words.join(" ").replace(/^a\s+/i, "").replace(/^an\s+/i, ""));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Manifest a Creation
          </DialogTitle>
          <DialogDescription>
            Describe what you want to build. The world will transform to include your creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 flex-1 overflow-auto">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="build-name" className="text-sm font-semibold">Name your creation</Label>
            <Input
              id="build-name"
              placeholder='e.g. "Crystal Spire of Dawn"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={building}
              maxLength={60}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="build-desc" className="text-sm font-semibold">Describe what you want to create</Label>
            <Textarea
              id="build-desc"
              placeholder="Describe your creation in detail — what it looks like, what it does, how it feels..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={building}
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">Need inspiration? Click an idea:</Label>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  disabled={building}
                >
                  {example.length > 45 ? example.slice(0, 45) + "…" : example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Build Button */}
        <div className="pt-3 border-t border-border">
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !description.trim() || building}
            className="w-full gap-2"
          >
            {building ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating your world...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Manifest Creation
              </>
            )}
          </Button>
          {building && (
            <p className="text-[10px] text-muted-foreground text-center mt-2 animate-pulse">
              The AI is painting your creation into the world... this may take a moment ✨
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home, Building2, Gem, TreePine, Landmark, Castle,
  Triangle, CircleDot, Compass, Flower, Flame, Mountain,
  Loader2, Sparkles
} from "lucide-react";

const STRUCTURE_TYPES = [
  { type: "house", label: "House", icon: Home, color: "#c8956a" },
  { type: "tower", label: "Tower", icon: Building2, color: "#8a7ab0" },
  { type: "crystal", label: "Crystal", icon: Gem, color: "#00ced1" },
  { type: "tree", label: "Tree", icon: TreePine, color: "#3a9a5a" },
  { type: "temple", label: "Temple", icon: Landmark, color: "#d4af37" },
  { type: "castle", label: "Castle", icon: Castle, color: "#8a8a8a" },
  { type: "portal", label: "Portal", icon: CircleDot, color: "#9b59b6" },
  { type: "fountain", label: "Fountain", icon: Compass, color: "#3498db" },
  { type: "garden", label: "Garden", icon: Flower, color: "#2ecc71" },
  { type: "pyramid", label: "Pyramid", icon: Triangle, color: "#f39c12" },
  { type: "shrine", label: "Shrine", icon: Flame, color: "#e74c3c" },
  { type: "mountain", label: "Mountain", icon: Mountain, color: "#7f8c8d" },
];

const MATERIAL_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "crystal", label: "Crystal" },
  { value: "glowing", label: "Glowing" },
  { value: "metallic", label: "Metallic" },
  { value: "stone", label: "Stone" },
];

const SCALE_OPTIONS = [
  { value: 0.5, label: "Small" },
  { value: 1, label: "Medium" },
  { value: 1.5, label: "Large" },
  { value: 2, label: "Grand" },
  { value: 3, label: "Massive" },
];

export interface BuildSpec {
  structure_type: string;
  name: string;
  description: string;
  color: string;
  scale: number;
  material_type: string;
}

interface WorldBuildDialogProps {
  open: boolean;
  onClose: () => void;
  onBuild: (spec: BuildSpec) => Promise<void>;
  building: boolean;
  preselectedType?: string;
}

export function WorldBuildDialog({ open, onClose, onBuild, building, preselectedType }: WorldBuildDialogProps) {
  const [selectedType, setSelectedType] = useState(preselectedType || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#7c3aed");
  const [material, setMaterial] = useState("standard");
  const [scale, setScale] = useState(1);

  const resetForm = () => {
    setSelectedType("");
    setName("");
    setDescription("");
    setColor("#7c3aed");
    setMaterial("standard");
    setScale(1);
  };

  const handleSubmit = async () => {
    if (!selectedType || !name.trim()) return;
    await onBuild({
      structure_type: selectedType,
      name: name.trim(),
      description: description.trim() || `A ${selectedType} in the world`,
      color,
      scale,
      material_type: material,
    });
    resetForm();
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (!building) {
        resetForm();
        onClose();
      }
    }
  };

  // When preselectedType changes, update
  if (preselectedType && preselectedType !== selectedType && open) {
    setSelectedType(preselectedType);
    const match = STRUCTURE_TYPES.find(s => s.type === preselectedType);
    if (match) {
      setColor(match.color);
      if (!name) setName("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Manifest a Creation
          </DialogTitle>
          <DialogDescription>
            Choose what to build, give it a name, and customize its appearance.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-5 py-2">
            {/* Step 1: Choose Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">What would you like to create?</Label>
              <div className="grid grid-cols-4 gap-2">
                {STRUCTURE_TYPES.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      setSelectedType(item.type);
                      setColor(item.color);
                    }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-xs
                      ${selectedType === item.type
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                      }`}
                    disabled={building}
                  >
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedType && (
              <>
                {/* Step 2: Name */}
                <div className="space-y-2">
                  <Label htmlFor="build-name" className="text-sm font-semibold">Name your creation</Label>
                  <Input
                    id="build-name"
                    placeholder={`e.g. "The Crystal Spire of Dawn"`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={building}
                    maxLength={60}
                  />
                </div>

                {/* Step 3: Description */}
                <div className="space-y-2">
                  <Label htmlFor="build-desc" className="text-sm font-semibold">Describe it (optional)</Label>
                  <Textarea
                    id="build-desc"
                    placeholder="A towering crystal structure that glows with ethereal light..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={building}
                    rows={2}
                    maxLength={200}
                  />
                </div>

                {/* Step 4: Color */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      disabled={building}
                    />
                    <span className="text-xs text-muted-foreground">{color}</span>
                  </div>
                </div>

                {/* Step 5: Material */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Material</Label>
                  <div className="flex gap-2 flex-wrap">
                    {MATERIAL_TYPES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMaterial(m.value)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all
                          ${material === m.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                          }`}
                        disabled={building}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 6: Scale */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Size</Label>
                  <div className="flex gap-2 flex-wrap">
                    {SCALE_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setScale(s.value)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all
                          ${scale === s.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                          }`}
                        disabled={building}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Build Button */}
        <div className="pt-3 border-t border-border">
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || !name.trim() || building}
            className="w-full gap-2"
          >
            {building ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Manifesting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Manifest Creation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

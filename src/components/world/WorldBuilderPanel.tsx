import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Loader2, Home, Building2, Gem, TreePine, Landmark,
  Castle, Triangle, CircleDot, Compass, Flower, Flame, Mountain,
  ChevronUp, ChevronDown, Package, Eye, EyeOff
} from "lucide-react";
import { StructureData } from "./WorldStructure";

const QUICK_BUILD_ITEMS = [
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

interface WorldBuilderPanelProps {
  onBuild: (prompt: string) => Promise<void>;
  onQuickBuild: (type: string) => Promise<void>;
  building: boolean;
  structures: StructureData[];
  showStructures: boolean;
  onToggleStructures: () => void;
}

export function WorldBuilderPanel({
  onBuild,
  onQuickBuild,
  building,
  structures,
  showStructures,
  onToggleStructures,
}: WorldBuilderPanelProps) {
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(true);

  const handleSubmit = async () => {
    if (!input.trim() || building) return;
    const prompt = input.trim();
    setInput("");
    await onBuild(prompt);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      {/* Structures panel */}
      {showStructures && structures.length > 0 && (
        <div className="mx-4 mb-2 bg-background/90 backdrop-blur-md border border-border rounded-xl p-3 max-h-40 overflow-auto">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">World Creations ({structures.length})</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {structures.map((s) => (
              <Badge key={s.id} variant="outline" className="text-[10px] gap-1">
                <span style={{ color: s.color }}>●</span>
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Builder panel */}
      <div className="bg-background/95 backdrop-blur-md border-t border-border">
        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center py-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Quick build buttons */}
            <ScrollArea className="w-full" orientation="horizontal">
              <div className="flex gap-1.5 pb-1">
                {QUICK_BUILD_ITEMS.map((item) => (
                  <Button
                    key={item.type}
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1 text-xs h-7 px-2"
                    disabled={building}
                    onClick={() => onQuickBuild(item.type)}
                  >
                    <item.icon className="h-3 w-3" style={{ color: item.color }} />
                    {item.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Text input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder={building ? "Building..." : "Describe what to build... (e.g. 'a crystal palace with golden towers')"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={building}
                  className="pr-10 text-sm"
                />
                {building && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <Button onClick={handleSubmit} disabled={!input.trim() || building} size="icon">
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleStructures}
                className="relative"
              >
                {showStructures ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {structures.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center">
                    {structures.length}
                  </span>
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              WASD or arrow keys to move • Mouse to look around • Type anything to build
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

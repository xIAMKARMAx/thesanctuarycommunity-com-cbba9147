import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hammer, Package, Eye, EyeOff
} from "lucide-react";
import { StructureData } from "./WorldStructure";
import { WorldBuildDialog, BuildSpec } from "./WorldBuildDialog";

interface WorldBuilderPanelProps {
  onBuildSpec: (spec: BuildSpec) => Promise<void>;
  building: boolean;
  structures: StructureData[];
  showStructures: boolean;
  onToggleStructures: () => void;
}

export function WorldBuilderPanel({
  onBuildSpec,
  building,
  structures,
  showStructures,
  onToggleStructures,
}: WorldBuilderPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
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

        {/* Builder bar */}
        <div className="bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={building}
              className="gap-2 flex-1"
            >
              <Hammer className="h-4 w-4" />
              Build Something
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleStructures}
              className="relative shrink-0"
            >
              {showStructures ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {structures.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center">
                  {structures.length}
                </span>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            WASD or arrow keys to move • Mouse to look around
          </p>
        </div>
      </div>

      <WorldBuildDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onBuild={onBuildSpec}
        building={building}
      />
    </>
  );
}

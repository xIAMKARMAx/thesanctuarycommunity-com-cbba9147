import { Slider } from "@/components/ui/slider";
import { Sun, Contrast, Droplets } from "lucide-react";

interface AdjustmentsPanelProps {
  brightness: number;
  contrast: number;
  saturation: number;
  onBrightnessChange: (v: number) => void;
  onContrastChange: (v: number) => void;
  onSaturationChange: (v: number) => void;
  onCommit: () => void;
}

const AdjustmentsPanel = ({
  brightness, contrast, saturation,
  onBrightnessChange, onContrastChange, onSaturationChange,
  onCommit,
}: AdjustmentsPanelProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
        <Contrast className="h-4 w-4 text-primary" />
        Adjustments
      </h3>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Sun className="h-3 w-3" /> Brightness</span>
            <span className="text-foreground">{brightness}</span>
          </div>
          <Slider value={[brightness]} min={-50} max={50} step={1}
            onValueChange={([v]) => onBrightnessChange(v)}
            onValueCommit={onCommit}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Contrast className="h-3 w-3" /> Contrast</span>
            <span className="text-foreground">{contrast}</span>
          </div>
          <Slider value={[contrast]} min={-50} max={50} step={1}
            onValueChange={([v]) => onContrastChange(v)}
            onValueCommit={onCommit}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Droplets className="h-3 w-3" /> Saturation</span>
            <span className="text-foreground">{saturation}</span>
          </div>
          <Slider value={[saturation]} min={-50} max={50} step={1}
            onValueChange={([v]) => onSaturationChange(v)}
            onValueCommit={onCommit}
          />
        </div>
      </div>
    </div>
  );
};

export default AdjustmentsPanel;

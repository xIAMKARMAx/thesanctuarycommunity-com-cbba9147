import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FRAME_PRESETS, FRAME_CATEGORIES, type FramePreset } from "../data/filters-effects";
import { Frame, Lock } from "lucide-react";

interface FramesPanelProps {
  onApplyFrame: (frame: FramePreset | null) => void;
  activeFrame: string | null;
  isLocked: boolean;
  hasImage: boolean;
}

const FramesPanel = ({ onApplyFrame, activeFrame, isLocked, hasImage }: FramesPanelProps) => {
  const [activeCategory, setActiveCategory] = useState("Classic");

  const filtered = FRAME_PRESETS.filter(f => f.category === activeCategory);

  if (isLocked) {
    return (
      <div className="p-4 text-center space-y-2">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Subscribe to unlock 24+ frames</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
        <Frame className="h-4 w-4 text-primary" />
        Frames
      </h3>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onApplyFrame(null)}
          className={`px-2 py-1 rounded text-xs font-medium transition-all
            ${activeFrame === null
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
        >
          None
        </button>
        {FRAME_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all
              ${activeCategory === cat && activeFrame !== null
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-3 gap-1.5 pr-2">
          {filtered.map(frame => (
            <button
              key={frame.id}
              onClick={() => hasImage && onApplyFrame(frame)}
              disabled={!hasImage}
              className={`aspect-square flex items-center justify-center p-1 rounded-lg transition-all disabled:opacity-40
                ${activeFrame === frame.id
                  ? "ring-2 ring-primary"
                  : "hover:ring-1 hover:ring-primary/40"
                }`}
            >
              <div
                className="w-full h-full rounded-sm bg-muted/30 flex items-center justify-center"
                style={{
                  border: `${Math.min(frame.borderWidth, 6)}px ${frame.borderStyle} ${frame.borderColor}`,
                  borderRadius: frame.borderRadius,
                  boxShadow: frame.shadow,
                }}
              >
                {frame.cornerEmoji ? (
                  <span className="text-sm">{frame.cornerEmoji}</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground font-medium">{frame.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FramesPanel;

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TEXT_PRESETS, TEXT_CATEGORIES, type TextPreset } from "../data/text-presets";
import { Type, Lock } from "lucide-react";

interface TextStylesPanelProps {
  onAddText: (preset: TextPreset) => void;
  isLocked: boolean;
  hasImage: boolean;
}

const TextStylesPanel = ({ onAddText, isLocked, hasImage }: TextStylesPanelProps) => {
  const [activeCategory, setActiveCategory] = useState("Popular");

  const filtered = TEXT_PRESETS.filter(p => p.category === activeCategory);

  if (isLocked) {
    return (
      <div className="p-4 text-center space-y-2">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Subscribe to unlock 50+ text styles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
        <Type className="h-4 w-4 text-primary" />
        Text Styles
      </h3>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {TEXT_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all
              ${activeCategory === cat
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Style grid */}
      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-2 gap-1.5 pr-2">
          {filtered.map(preset => (
            <button
              key={preset.id}
              onClick={() => hasImage && onAddText(preset)}
              disabled={!hasImage}
              className="p-2 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-left disabled:opacity-40"
              style={{ fontFamily: preset.fontFamily }}
            >
              <span
                className="text-xs font-medium block truncate"
                style={{
                  color: preset.fill,
                  fontWeight: preset.fontWeight as any,
                  fontStyle: preset.fontStyle,
                  textShadow: preset.shadow
                    ? `${preset.shadow.offsetX}px ${preset.shadow.offsetY}px ${preset.shadow.blur}px ${preset.shadow.color}`
                    : undefined,
                  WebkitTextStroke: preset.stroke ? `${preset.strokeWidth || 1}px ${preset.stroke}` : undefined,
                }}
              >
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TextStylesPanel;

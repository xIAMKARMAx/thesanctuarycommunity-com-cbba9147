import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EFFECT_OVERLAYS, EFFECT_CATEGORIES, type EffectOverlay } from "../data/filters-effects";
import { Sparkles, Lock } from "lucide-react";

interface EffectsPanelProps {
  onAddEffect: (effect: EffectOverlay) => void;
  isLocked: boolean;
  hasImage: boolean;
}

const EffectsPanel = ({ onAddEffect, isLocked, hasImage }: EffectsPanelProps) => {
  const [activeCategory, setActiveCategory] = useState("Hearts");

  const filtered = EFFECT_OVERLAYS.filter(e => e.category === activeCategory);

  if (isLocked) {
    return (
      <div className="p-4 text-center space-y-2">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Subscribe to unlock 30+ smart effects</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        Smart Effects
      </h3>

      <div className="flex flex-wrap gap-1">
        {EFFECT_CATEGORIES.map(cat => (
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

      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-2 gap-1.5 pr-2">
          {filtered.map(effect => (
            <button
              key={effect.id}
              onClick={() => hasImage && onAddEffect(effect)}
              disabled={!hasImage}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-40"
            >
              <span className="text-xl">{effect.emoji}</span>
              <span className="text-xs font-medium text-foreground truncate">{effect.label}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EffectsPanel;

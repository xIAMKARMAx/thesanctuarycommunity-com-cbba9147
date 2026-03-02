import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STICKERS, STICKER_CATEGORIES, type Sticker } from "../data/stickers";
import { SmilePlus, Lock } from "lucide-react";

interface StickersPanelProps {
  onAddSticker: (sticker: Sticker) => void;
  isLocked: boolean;
  hasImage: boolean;
}

const StickersPanel = ({ onAddSticker, isLocked, hasImage }: StickersPanelProps) => {
  const [activeCategory, setActiveCategory] = useState("Love");

  const filtered = STICKERS.filter(s => s.category === activeCategory);

  if (isLocked) {
    return (
      <div className="p-4 text-center space-y-2">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Subscribe to unlock 80+ stickers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
        <SmilePlus className="h-4 w-4 text-primary" />
        Stickers
      </h3>

      <div className="flex flex-wrap gap-1">
        {STICKER_CATEGORIES.map(cat => (
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
        <div className="grid grid-cols-4 gap-1.5 pr-2">
          {filtered.map(sticker => (
            <button
              key={sticker.id}
              onClick={() => hasImage && onAddSticker(sticker)}
              disabled={!hasImage}
              className="aspect-square flex items-center justify-center rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-2xl disabled:opacity-40"
              title={sticker.label}
            >
              {sticker.emoji}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default StickersPanel;

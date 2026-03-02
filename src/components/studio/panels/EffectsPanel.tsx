import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EFFECT_OVERLAYS, EFFECT_CATEGORIES, type EffectOverlay } from "../data/filters-effects";
import { IMAGE_EFFECTS, EFFECT_PACK_CATEGORIES, type ImageAsset } from "../data/image-assets";
import { Sparkles, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface EffectsPanelProps {
  onAddEffect: (effect: EffectOverlay) => void;
  onAddImageOverlay?: (asset: ImageAsset) => void;
  isLocked: boolean;
  hasImage: boolean;
}

const EffectsPanel = ({ onAddEffect, onAddImageOverlay, isLocked, hasImage }: EffectsPanelProps) => {
  const [emojiCategory, setEmojiCategory] = useState("Hearts");
  const [imageCategory, setImageCategory] = useState("Love Vibes");

  const filteredEmoji = EFFECT_OVERLAYS.filter(e => e.category === emojiCategory);
  const filteredImages = IMAGE_EFFECTS.filter(e => e.category === imageCategory);

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

      <Tabs defaultValue="premium" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="premium" className="text-xs">✨ Premium</TabsTrigger>
          <TabsTrigger value="emoji" className="text-xs">😊 Classic</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            {EFFECT_PACK_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setImageCategory(cat)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all
                  ${imageCategory === cat
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <ScrollArea className="h-[260px]">
            <div className="grid grid-cols-2 gap-2 pr-2">
              {filteredImages.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => hasImage && onAddImageOverlay?.(asset)}
                  disabled={!hasImage}
                  className="group relative rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-all disabled:opacity-40"
                >
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.label}
                    className="w-full aspect-square object-cover bg-black"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <span className="text-[10px] font-medium text-white">{asset.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="emoji" className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            {EFFECT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setEmojiCategory(cat)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all
                  ${emojiCategory === cat
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <ScrollArea className="h-[260px]">
            <div className="grid grid-cols-2 gap-1.5 pr-2">
              {filteredEmoji.map(effect => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EffectsPanel;

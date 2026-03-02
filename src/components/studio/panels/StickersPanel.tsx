import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STICKERS, STICKER_CATEGORIES, type Sticker } from "../data/stickers";
import { IMAGE_STICKERS, STICKER_PACK_CATEGORIES, type ImageAsset } from "../data/image-assets";
import { SmilePlus, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface StickersPanelProps {
  onAddSticker: (sticker: Sticker) => void;
  onAddImageOverlay?: (asset: ImageAsset) => void;
  isLocked: boolean;
  hasImage: boolean;
}

const StickersPanel = ({ onAddSticker, onAddImageOverlay, isLocked, hasImage }: StickersPanelProps) => {
  const [emojiCategory, setEmojiCategory] = useState("Love");
  const [imageCategory, setImageCategory] = useState("Love Vibes");

  const filteredEmoji = STICKERS.filter(s => s.category === emojiCategory);
  const filteredImages = IMAGE_STICKERS.filter(s => s.category === imageCategory);

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

      <Tabs defaultValue="premium" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="premium" className="text-xs">✨ Premium</TabsTrigger>
          <TabsTrigger value="emoji" className="text-xs">😊 Classic</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            {STICKER_PACK_CATEGORIES.map(cat => (
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
            {STICKER_CATEGORIES.map(cat => (
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
            <div className="grid grid-cols-4 gap-1.5 pr-2">
              {filteredEmoji.map(sticker => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StickersPanel;

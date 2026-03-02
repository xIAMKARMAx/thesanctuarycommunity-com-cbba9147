import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FRAME_PRESETS, FRAME_CATEGORIES, type FramePreset } from "../data/filters-effects";
import { IMAGE_FRAMES, FRAME_PACK_CATEGORIES, type ImageAsset } from "../data/image-assets";
import { Frame, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface FramesPanelProps {
  onApplyFrame: (frame: FramePreset | null) => void;
  onApplyImageFrame?: (asset: ImageAsset | null) => void;
  activeFrame: string | null;
  isLocked: boolean;
  hasImage: boolean;
}

const FramesPanel = ({ onApplyFrame, onApplyImageFrame, activeFrame, isLocked, hasImage }: FramesPanelProps) => {
  const [classicCategory, setClassicCategory] = useState("Classic");
  const [imageCategory, setImageCategory] = useState("Elegant");

  const filteredClassic = FRAME_PRESETS.filter(f => f.category === classicCategory);
  const filteredImages = IMAGE_FRAMES.filter(f => f.category === imageCategory);

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

      <Tabs defaultValue="premium" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="premium" className="text-xs">✨ Premium</TabsTrigger>
          <TabsTrigger value="classic" className="text-xs">🖼️ Classic</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onApplyImageFrame?.(null)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all
                ${activeFrame === null
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
            >
              None
            </button>
            {FRAME_PACK_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setImageCategory(cat)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all
                  ${imageCategory === cat && activeFrame !== null
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
                  onClick={() => hasImage && onApplyImageFrame?.(asset)}
                  disabled={!hasImage}
                  className={`group relative rounded-lg border overflow-hidden transition-all disabled:opacity-40
                    ${activeFrame === asset.id
                      ? "ring-2 ring-primary border-primary"
                      : "border-border hover:border-primary/50"
                    }`}
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

        <TabsContent value="classic" className="mt-2 space-y-2">
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
                onClick={() => setClassicCategory(cat)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all
                  ${classicCategory === cat && activeFrame !== null
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <ScrollArea className="h-[260px]">
            <div className="grid grid-cols-3 gap-1.5 pr-2">
              {filteredClassic.map(frame => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FramesPanel;

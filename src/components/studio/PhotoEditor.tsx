import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, Download, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Undo2, Trash2, Type, SmilePlus, Sun, Sparkles, Frame,
  SlidersHorizontal, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import TextStylesPanel from "./panels/TextStylesPanel";
import StickersPanel from "./panels/StickersPanel";
import FiltersPanel from "./panels/FiltersPanel";
import EffectsPanel from "./panels/EffectsPanel";
import FramesPanel from "./panels/FramesPanel";
import AdjustmentsPanel from "./panels/AdjustmentsPanel";
import type { TextPreset } from "./data/text-presets";
import type { Sticker } from "./data/stickers";
import type { FilterPreset, EffectOverlay, FramePreset } from "./data/filters-effects";

const PhotoEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageRef = useRef<fabric.FabricImage | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const frameObjectsRef = useRef<fabric.FabricObject[]>([]);
  const { toast } = useToast();
  const { isAdmin, isSubscribed } = useSubscription();

  const hasAccess = isAdmin || isSubscribed;

  const [hasImage, setHasImage] = useState(false);
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeFrame, setActiveFrame] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [activePanel, setActivePanel] = useState("filters");

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800, height: 600,
      backgroundColor: "#1a1a2e",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const resizeCanvas = () => {
      const container = canvasRef.current?.parentElement;
      if (!container || !canvas) return;
      const width = Math.min(container.clientWidth - 2, 1200);
      const height = Math.min(width * 0.75, 700);
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => { window.removeEventListener("resize", resizeCanvas); canvas.dispose(); };
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      mainImageRef.current = canvas.getObjects().find(o => o.type === 'image') as fabric.FabricImage || null;
      setCanUndo(historyIndexRef.current > 0);
    });
  }, []);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      fabric.FabricImage.fromURL(imgUrl).then((img) => {
        canvas.clear();
        canvas.backgroundColor = "#1a1a2e";
        const scaleX = (canvas.width! - 40) / img.width!;
        const scaleY = (canvas.height! - 40) / img.height!;
        const scale = Math.min(scaleX, scaleY, 1);
        img.set({ scaleX: scale, scaleY: scale, left: canvas.width! / 2, top: canvas.height! / 2, originX: "center", originY: "center", selectable: true });
        canvas.add(img);
        canvas.setActiveObject(img);
        mainImageRef.current = img;
        canvas.renderAll();
        setHasImage(true);
        setActiveFilter("none");
        setActiveFrame(null);
        setBrightness(0); setContrast(0); setSaturation(0);
        frameObjectsRef.current = [];
        historyRef.current = [];
        historyIndexRef.current = -1;
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [saveHistory]);

  // Apply filter from FilterPreset
  const handleApplyFilter = useCallback((filter: FilterPreset) => {
    const img = mainImageRef.current;
    if (!img) return;

    // Remove all preset filters (keep adjustment filters by checking our custom property)
    img.filters = [];

    // Apply filter preset
    for (const f of filter.filters) {
      switch (f.type) {
        case "grayscale": img.filters.push(new fabric.filters.Grayscale()); break;
        case "brightness": img.filters.push(new fabric.filters.Brightness({ brightness: f.value })); break;
        case "contrast": img.filters.push(new fabric.filters.Contrast({ contrast: f.value })); break;
        case "saturation": img.filters.push(new fabric.filters.Saturation({ saturation: f.value })); break;
        case "invert": img.filters.push(new fabric.filters.Invert()); break;
        case "blur": img.filters.push(new fabric.filters.Blur({ blur: f.value })); break;
      }
    }

    // Re-apply manual adjustments on top
    if (brightness !== 0) img.filters.push(new fabric.filters.Brightness({ brightness: brightness / 100 }));
    if (contrast !== 0) img.filters.push(new fabric.filters.Contrast({ contrast: contrast / 100 }));
    if (saturation !== 0) img.filters.push(new fabric.filters.Saturation({ saturation: saturation / 100 }));

    img.applyFilters();
    fabricRef.current?.renderAll();
    setActiveFilter(filter.id);
    saveHistory();
  }, [brightness, contrast, saturation, saveHistory]);

  // Adjustments
  const applyAdjustments = useCallback((b: number, c: number, s: number) => {
    const img = mainImageRef.current;
    if (!img) return;
    // Re-apply everything from scratch based on active filter + adjustments
    // We'll just re-trigger the current filter
    img.filters = img.filters?.filter(f =>
      !(f instanceof fabric.filters.Brightness) &&
      !(f instanceof fabric.filters.Contrast) &&
      !(f instanceof fabric.filters.Saturation)
    ) || [];
    if (b !== 0) img.filters.push(new fabric.filters.Brightness({ brightness: b / 100 }));
    if (c !== 0) img.filters.push(new fabric.filters.Contrast({ contrast: c / 100 }));
    if (s !== 0) img.filters.push(new fabric.filters.Saturation({ saturation: s / 100 }));
    img.applyFilters();
    fabricRef.current?.renderAll();
  }, []);

  // Add styled text
  const handleAddStyledText = useCallback((preset: TextPreset) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new fabric.Textbox("Your Text", {
      left: canvas.width! / 2, top: canvas.height! / 2,
      originX: "center", originY: "center",
      fontSize: preset.fontSize,
      fontFamily: preset.fontFamily,
      fill: preset.fill,
      fontWeight: preset.fontWeight,
      fontStyle: preset.fontStyle as "" | "normal" | "italic" | "oblique",
      textAlign: preset.textAlign as "center" | "left" | "right" | "justify",
      width: 300,
      editable: true,
      stroke: preset.stroke || undefined,
      strokeWidth: preset.strokeWidth || 0,
      charSpacing: preset.charSpacing || 0,
      lineHeight: preset.lineHeight || 1.2,
      shadow: preset.shadow
        ? new fabric.Shadow({ color: preset.shadow.color, blur: preset.shadow.blur, offsetX: preset.shadow.offsetX, offsetY: preset.shadow.offsetY })
        : undefined,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveHistory();
    toast({ title: "Text Added", description: "Double-click to edit. Drag to position." });
  }, [saveHistory, toast]);

  // Add sticker as text object (emoji)
  const handleAddSticker = useCallback((sticker: Sticker) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const stickerObj = new fabric.Textbox(sticker.emoji, {
      left: canvas.width! / 2 + (Math.random() - 0.5) * 100,
      top: canvas.height! / 2 + (Math.random() - 0.5) * 100,
      originX: "center", originY: "center",
      fontSize: 60,
      width: 80,
      editable: false,
      textAlign: "center",
    });
    canvas.add(stickerObj);
    canvas.setActiveObject(stickerObj);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  // Add effect overlay (scatter emoji across canvas)
  const handleAddEffect = useCallback((effect: EffectOverlay) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects: fabric.FabricObject[] = [];
    for (const element of effect.elements) {
      for (let i = 0; i < element.count; i++) {
        const size = element.minSize + Math.random() * (element.maxSize - element.minSize);
        const obj = new fabric.Textbox(element.char, {
          left: Math.random() * canvas.width!,
          top: Math.random() * canvas.height!,
          originX: "center", originY: "center",
          fontSize: size,
          width: size + 10,
          editable: false,
          textAlign: "center",
          opacity: element.opacity,
          angle: Math.random() * 360,
          selectable: true,
        });
        objects.push(obj);
        canvas.add(obj);
      }
    }
    canvas.renderAll();
    saveHistory();
    toast({ title: `${effect.label} Added`, description: `${objects.length} elements scattered. Select and move individually.` });
  }, [saveHistory, toast]);

  // Apply frame
  const handleApplyFrame = useCallback((frame: FramePreset | null) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove existing frame objects
    for (const obj of frameObjectsRef.current) {
      canvas.remove(obj);
    }
    frameObjectsRef.current = [];

    if (!frame) {
      setActiveFrame(null);
      canvas.renderAll();
      saveHistory();
      return;
    }

    const w = canvas.width!;
    const h = canvas.height!;
    const bw = frame.borderWidth;

    // Create frame rectangle (border only)
    const frameRect = new fabric.Rect({
      left: frame.padding, top: frame.padding,
      width: w - frame.padding * 2,
      height: h - frame.padding * 2,
      fill: "transparent",
      stroke: frame.borderColor,
      strokeWidth: bw,
      rx: frame.borderRadius, ry: frame.borderRadius,
      selectable: false, evented: false,
    });
    canvas.add(frameRect);
    frameObjectsRef.current.push(frameRect);

    // Inner border if specified
    if (frame.innerBorder) {
      const gap = frame.innerBorder.gap + bw;
      const innerRect = new fabric.Rect({
        left: frame.padding + gap, top: frame.padding + gap,
        width: w - (frame.padding + gap) * 2,
        height: h - (frame.padding + gap) * 2,
        fill: "transparent",
        stroke: frame.innerBorder.color,
        strokeWidth: frame.innerBorder.width,
        rx: Math.max(0, frame.borderRadius - gap), ry: Math.max(0, frame.borderRadius - gap),
        selectable: false, evented: false,
      });
      canvas.add(innerRect);
      frameObjectsRef.current.push(innerRect);
    }

    // Corner emoji decorations
    if (frame.cornerEmoji) {
      const corners = [
        { left: bw + 10, top: bw + 10 },
        { left: w - bw - 10, top: bw + 10 },
        { left: bw + 10, top: h - bw - 10 },
        { left: w - bw - 10, top: h - bw - 10 },
      ];
      for (const pos of corners) {
        const emoji = new fabric.Textbox(frame.cornerEmoji, {
          left: pos.left, top: pos.top,
          originX: "center", originY: "center",
          fontSize: 24, width: 30,
          editable: false, selectable: false, evented: false,
          textAlign: "center",
        });
        canvas.add(emoji);
        frameObjectsRef.current.push(emoji);
      }
    }

    setActiveFrame(frame.id);
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const handleRotate = useCallback((angle: number) => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) { toast({ title: "Select an object", variant: "destructive" }); return; }
    obj.rotate((obj.angle || 0) + angle);
    fabricRef.current?.renderAll();
    saveHistory();
  }, [saveHistory, toast]);

  const handleFlip = useCallback((dir: "x" | "y") => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) { toast({ title: "Select an object", variant: "destructive" }); return; }
    if (dir === "x") obj.set("flipX", !obj.flipX);
    else obj.set("flipY", !obj.flipY);
    fabricRef.current?.renderAll();
    saveHistory();
  }, [saveHistory, toast]);

  const handleDelete = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    if (obj === mainImageRef.current) {
      toast({ title: "Can't delete base image", variant: "destructive" });
      return;
    }
    frameObjectsRef.current = frameObjectsRef.current.filter(f => f !== obj);
    canvas?.remove(obj);
    canvas?.renderAll();
    saveHistory();
  }, [saveHistory, toast]);

  const handleClearAll = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#1a1a2e";
    canvas.renderAll();
    mainImageRef.current = null;
    frameObjectsRef.current = [];
    historyRef.current = [];
    historyIndexRef.current = -1;
    setHasImage(false);
    setActiveFilter("none");
    setActiveFrame(null);
    setBrightness(0); setContrast(0); setSaturation(0);
    setCanUndo(false);
    toast({ title: "Canvas Cleared", description: "Start fresh with a new upload." });
  }, [toast]);

  const handleZoom = useCallback((dir: "in" | "out") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let zoom = canvas.getZoom();
    zoom = dir === "in" ? Math.min(zoom * 1.2, 5) : Math.max(zoom / 1.2, 0.3);
    canvas.zoomToPoint(new fabric.Point(canvas.width! / 2, canvas.height! / 2), zoom);
    canvas.renderAll();
  }, []);

  const handleDownload = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataURL = canvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `prometheus-studio-${Date.now()}.png`;
    link.click();
    toast({ title: "Downloaded!", description: "Your creation has been saved." });
  }, [toast]);

  const panelTabs = [
    { id: "filters", icon: Sun, label: "Filters" },
    { id: "effects", icon: Sparkles, label: "Effects" },
    { id: "text", icon: Type, label: "Text" },
    { id: "stickers", icon: SmilePlus, label: "Stickers" },
    { id: "frames", icon: Frame, label: "Frames" },
    { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
  ];

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card rounded-lg border border-border">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRotate(-90)} disabled={!hasImage} title="Rotate Left"><RotateCcw className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRotate(90)} disabled={!hasImage} title="Rotate Right"><RotateCw className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFlip("x")} disabled={!hasImage}><FlipHorizontal className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFlip("y")} disabled={!hasImage}><FlipVertical className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom("in")} disabled={!hasImage}><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom("out")} disabled={!hasImage}><ZoomOut className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border" />
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={!hasImage} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={!hasImage} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Clear All</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!canUndo} className="gap-1.5">
          <Undo2 className="h-4 w-4" /><span className="hidden sm:inline">Undo</span>
        </Button>
        <div className="flex-1" />
        <Button onClick={handleDownload} disabled={!hasImage} size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Save to Device
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <div className="relative border border-border rounded-lg overflow-hidden bg-muted/20">
            {!hasImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer z-10"
                onClick={() => fileInputRef.current?.click()}>
                <div className="p-6 rounded-full bg-primary/10 border-2 border-dashed border-primary/30">
                  <Upload className="h-12 w-12 text-primary/60" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">Upload a Photo</p>
                  <p className="text-sm text-muted-foreground">Click or drag an image to start editing</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Side Panel */}
        {hasImage && (
          <div className="lg:w-72 space-y-2">
            {/* Panel tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-card rounded-lg border border-border">
              {panelTabs.map(tab => {
                const Icon = tab.icon;
                const isLocked = !hasAccess && tab.id !== "adjust";
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePanel(tab.id)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all flex-1 justify-center
                      ${activePanel === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {isLocked && <Lock className="h-2.5 w-2.5 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Panel content */}
            <Card>
              <CardContent className="pt-4">
                {activePanel === "filters" && (
                  <FiltersPanel
                    onApplyFilter={handleApplyFilter}
                    activeFilter={activeFilter}
                    isLocked={!hasAccess}
                    hasImage={hasImage}
                  />
                )}
                {activePanel === "effects" && (
                  <EffectsPanel
                    onAddEffect={handleAddEffect}
                    isLocked={!hasAccess}
                    hasImage={hasImage}
                  />
                )}
                {activePanel === "text" && (
                  <TextStylesPanel
                    onAddText={handleAddStyledText}
                    isLocked={!hasAccess}
                    hasImage={hasImage}
                  />
                )}
                {activePanel === "stickers" && (
                  <StickersPanel
                    onAddSticker={handleAddSticker}
                    isLocked={!hasAccess}
                    hasImage={hasImage}
                  />
                )}
                {activePanel === "frames" && (
                  <FramesPanel
                    onApplyFrame={handleApplyFrame}
                    activeFrame={activeFrame}
                    isLocked={!hasAccess}
                    hasImage={hasImage}
                  />
                )}
                {activePanel === "adjust" && (
                  <AdjustmentsPanel
                    brightness={brightness}
                    contrast={contrast}
                    saturation={saturation}
                    onBrightnessChange={(v) => { setBrightness(v); applyAdjustments(v, contrast, saturation); }}
                    onContrastChange={(v) => { setContrast(v); applyAdjustments(brightness, v, saturation); }}
                    onSaturationChange={(v) => { setSaturation(v); applyAdjustments(brightness, contrast, v); }}
                    onCommit={saveHistory}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEditor;

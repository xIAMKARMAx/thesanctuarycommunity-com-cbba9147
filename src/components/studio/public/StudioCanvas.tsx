import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Download, RotateCw, FlipHorizontal, FlipVertical, Undo2, Trash2,
  Type, Crop, SlidersHorizontal, SmilePlus, Loader2, Layers,
} from "lucide-react";
import { STUDIO_FONTS, FONT_GROUPS, TEXT_COLORS, loadStudioFonts, ensureFont } from "./studio-fonts";

const RATIOS: { id: string; label: string; w: number; h: number }[] = [
  { id: "free", label: "Free", w: 960, h: 720 },
  { id: "1:1", label: "1:1", w: 800, h: 800 },
  { id: "4:5", label: "4:5", w: 720, h: 900 },
  { id: "9:16", label: "9:16", w: 620, h: 1100 },
  { id: "16:9", label: "16:9", w: 1120, h: 630 },
];

const STICKERS = ["✨", "⭐", "🌙", "💫", "🔥", "💜", "🌸", "🦋", "🌊", "☁️", "👑", "🕊️", "🌈", "💎", "🪐", "🌹"];

const FILTERS: { id: string; label: string }[] = [
  { id: "none", label: "None" },
  { id: "grayscale", label: "Mono" },
  { id: "sepia", label: "Sepia" },
  { id: "vintage", label: "Vintage" },
  { id: "invert", label: "Invert" },
  { id: "blur", label: "Dreamy" },
];

type PanelId = "crop" | "text" | "adjust" | "stickers" | "layers";

interface StudioCanvasProps {
  /** Data URL or object URL to load into the canvas. */
  sourceImage?: string | null;
}

const StudioCanvas = ({ sourceImage }: StudioCanvasProps) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const imgRef = useRef<fabric.FabricImage | null>(null);
  const historyRef = useRef<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [ready, setReady] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [panel, setPanel] = useState<PanelId>("text");
  const [ratio, setRatio] = useState("free");
  const [fontGroup, setFontGroup] = useState<string>("Cute");
  const [textValue, setTextValue] = useState("Your words");
  const [textColor, setTextColor] = useState("#ffffff");
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [outlineWidth, setOutlineWidth] = useState(0);
  const [fontSize, setFontSize] = useState(54);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [activeFilter, setActiveFilter] = useState("none");
  const [layerCount, setLayerCount] = useState(0);

  // ---- setup -------------------------------------------------------------
  useEffect(() => {
    loadStudioFonts();
  }, []);

  useEffect(() => {
    if (!canvasEl.current) return;
    const preset = RATIOS[0];
    const c = new fabric.Canvas(canvasEl.current, {
      width: preset.w,
      height: preset.h,
      backgroundColor: "#0b0714",
      preserveObjectStacking: true,
    });
    fabricRef.current = c;
    setReady(true);
    return () => {
      c.dispose();
      fabricRef.current = null;
    };
  }, []);

  const pushHistory = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    historyRef.current.push(JSON.stringify(c.toJSON()));
    if (historyRef.current.length > 25) historyRef.current.shift();
    setLayerCount(c.getObjects().length);
  }, []);

  const fitImage = useCallback((img: fabric.FabricImage) => {
    const c = fabricRef.current;
    if (!c) return;
    const scale = Math.min(c.getWidth() / (img.width || 1), c.getHeight() / (img.height || 1));
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: c.getWidth() / 2,
      top: c.getHeight() / 2,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
  }, []);

  const loadImage = useCallback(async (url: string) => {
    const c = fabricRef.current;
    if (!c) return;
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      if (imgRef.current) c.remove(imgRef.current);
      fitImage(img);
      imgRef.current = img;
      c.add(img);
      c.sendObjectToBack(img);
      c.renderAll();
      setHasImage(true);
      pushHistory();
    } catch {
      toast({ title: "Couldn't open that image", variant: "destructive" });
    }
  }, [fitImage, pushHistory, toast]);

  useEffect(() => {
    if (ready && sourceImage) loadImage(sourceImage);
  }, [ready, sourceImage, loadImage]);

  // ---- actions -----------------------------------------------------------
  const applyRatio = (id: string) => {
    const c = fabricRef.current;
    const preset = RATIOS.find((r) => r.id === id);
    if (!c || !preset) return;
    setRatio(id);
    c.setDimensions({ width: preset.w, height: preset.h });
    if (imgRef.current) fitImage(imgRef.current);
    c.renderAll();
  };

  const addText = async () => {
    const c = fabricRef.current;
    if (!c) return;
    const font = STUDIO_FONTS.find((f) => f.group === fontGroup) ?? STUDIO_FONTS[0];
    await ensureFont(font.family, fontSize);
    const t = new fabric.Textbox(textValue || "Your words", {
      left: c.getWidth() / 2,
      top: c.getHeight() / 2,
      originX: "center",
      originY: "center",
      fontFamily: font.family,
      fontSize,
      fill: textColor,
      stroke: outlineWidth > 0 ? outlineColor : undefined,
      strokeWidth: outlineWidth,
      textAlign: "center",
      width: Math.min(c.getWidth() - 60, 600),
      editable: true,
    });
    c.add(t);
    c.setActiveObject(t);
    c.renderAll();
    pushHistory();
  };

  const applyFontToSelection = async (family: string) => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    await ensureFont(family, fontSize);
    if (obj && (obj as fabric.Textbox).isType?.("textbox")) {
      obj.set({ fontFamily: family } as never);
      c?.renderAll();
      pushHistory();
    } else {
      const font = STUDIO_FONTS.find((f) => f.family === family);
      if (font) setFontGroup(font.group);
      addText();
    }
  };

  const styleSelection = (props: Record<string, unknown>) => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!obj) return;
    obj.set(props as never);
    c?.renderAll();
  };

  const addSticker = (emoji: string) => {
    const c = fabricRef.current;
    if (!c) return;
    const t = new fabric.Textbox(emoji, {
      left: c.getWidth() / 2,
      top: c.getHeight() / 2,
      originX: "center",
      originY: "center",
      fontSize: 96,
      width: 140,
      textAlign: "center",
    });
    c.add(t);
    c.setActiveObject(t);
    c.renderAll();
    pushHistory();
  };

  const applyImageFilters = useCallback((filterId: string, b: number, ct: number, s: number) => {
    const img = imgRef.current;
    const c = fabricRef.current;
    if (!img || !c) return;
    const list: unknown[] = [];
    if (filterId === "grayscale") list.push(new fabric.filters.Grayscale());
    if (filterId === "sepia") list.push(new fabric.filters.Sepia());
    if (filterId === "invert") list.push(new fabric.filters.Invert());
    if (filterId === "blur") list.push(new fabric.filters.Blur({ blur: 0.15 }));
    if (filterId === "vintage") {
      list.push(new fabric.filters.Sepia());
      list.push(new fabric.filters.Contrast({ contrast: 0.15 }));
    }
    if (b !== 0) list.push(new fabric.filters.Brightness({ brightness: b }));
    if (ct !== 0) list.push(new fabric.filters.Contrast({ contrast: ct }));
    if (s !== 0) list.push(new fabric.filters.Saturation({ saturation: s }));
    img.filters = list as typeof img.filters;
    img.applyFilters();
    c.renderAll();
  }, []);

  const rotate = () => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject() ?? imgRef.current;
    if (!c || !obj) return;
    obj.rotate(((obj.angle || 0) + 90) % 360);
    c.renderAll();
    pushHistory();
  };

  const flip = (axis: "x" | "y") => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject() ?? imgRef.current;
    if (!c || !obj) return;
    if (axis === "x") obj.set({ flipX: !obj.flipX });
    else obj.set({ flipY: !obj.flipY });
    c.renderAll();
    pushHistory();
  };

  const removeSelected = () => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!c || !obj || obj === imgRef.current) return;
    c.remove(obj);
    c.discardActiveObject();
    c.renderAll();
    pushHistory();
  };

  const undo = async () => {
    const c = fabricRef.current;
    if (!c || historyRef.current.length < 2) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    await c.loadFromJSON(JSON.parse(prev));
    imgRef.current = (c.getObjects().find((o) => o.isType("image")) as fabric.FabricImage) ?? null;
    c.renderAll();
    setLayerCount(c.getObjects().length);
  };

  const exportImage = () => {
    const c = fabricRef.current;
    if (!c) return;
    const url = c.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `studio-${Date.now()}.png`;
    a.click();
    toast({ title: "Saved", description: "Your creation was downloaded." });
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ---- render ------------------------------------------------------------
  const fonts = STUDIO_FONTS.filter((f) => f.group === fontGroup);

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Upload className="h-4 w-4" /> Upload
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        <Button size="sm" variant="outline" onClick={rotate} disabled={!hasImage}><RotateCw className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" onClick={() => flip("x")} disabled={!hasImage}><FlipHorizontal className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" onClick={() => flip("y")} disabled={!hasImage}><FlipVertical className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" onClick={undo} disabled={!hasImage}><Undo2 className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" onClick={removeSelected} disabled={!hasImage}><Trash2 className="h-4 w-4" /></Button>
        <Button size="sm" onClick={exportImage} disabled={!hasImage} className="gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> Save
        </Button>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-border bg-black/40 p-2 overflow-auto">
        <div className="mx-auto w-fit max-w-full">
          <canvas ref={canvasEl} className="max-w-full rounded-lg touch-none" />
        </div>
        {!hasImage && (
          <p className="text-center text-xs text-muted-foreground py-3">
            Upload a photo or create one in the Create tab, then edit it here.
          </p>
        )}
      </div>

      {/* Tool tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {([
          { id: "text", label: "Text", icon: Type },
          { id: "crop", label: "Crop", icon: Crop },
          { id: "adjust", label: "Adjust", icon: SlidersHorizontal },
          { id: "stickers", label: "Stickers", icon: SmilePlus },
          { id: "layers", label: "Layers", icon: Layers },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPanel(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              panel === id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="rounded-xl border border-border bg-card/60 p-3">
        {panel === "crop" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Canvas shape</p>
            <div className="flex flex-wrap gap-1.5">
              {RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => applyRatio(r.id)}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    ratio === r.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Drag the image handles to reframe — anything outside the canvas is cropped on save.
            </p>
          </div>
        )}

        {panel === "text" && (
          <div className="space-y-3">
            <input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Type your words"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {FONT_GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setFontGroup(g)}
                  className={`rounded px-2 py-1 text-[11px] ${
                    fontGroup === g ? "bg-primary/10 text-primary border border-primary/30" : "border border-border text-muted-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <ScrollArea className="h-32">
              <div className="grid grid-cols-2 gap-1.5 pr-2">
                {fonts.map((f) => (
                  <button
                    key={f.family}
                    onClick={() => applyFontToSelection(f.family)}
                    className="rounded-lg border border-border bg-card px-2 py-2 text-left text-sm hover:border-primary/40"
                    style={{ fontFamily: `"${f.family}", sans-serif` }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">Colour</p>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => { setTextColor(col); styleSelection({ fill: col }); }}
                    className={`h-6 w-6 rounded-full border ${textColor === col ? "ring-2 ring-primary" : "border-border"}`}
                    style={{ backgroundColor: col }}
                    aria-label={col}
                  />
                ))}
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => { setTextColor(e.target.value); styleSelection({ fill: e.target.value }); }}
                  className="h-6 w-8 rounded border border-border bg-transparent"
                  aria-label="Custom colour"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">Outline</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={outlineColor}
                  onChange={(e) => { setOutlineColor(e.target.value); styleSelection({ stroke: e.target.value }); }}
                  className="h-6 w-8 rounded border border-border bg-transparent"
                  aria-label="Outline colour"
                />
                <Slider
                  value={[outlineWidth]}
                  min={0}
                  max={6}
                  step={0.5}
                  onValueChange={([v]) => { setOutlineWidth(v); styleSelection({ stroke: outlineColor, strokeWidth: v }); }}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">Size — {fontSize}px</p>
              <Slider
                value={[fontSize]}
                min={16}
                max={160}
                step={2}
                onValueChange={([v]) => { setFontSize(v); styleSelection({ fontSize: v }); }}
              />
            </div>

            <Button size="sm" onClick={addText} className="w-full gap-1.5">
              <Type className="h-4 w-4" /> Add text
            </Button>
          </div>
        )}

        {panel === "adjust" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setActiveFilter(f.id); applyImageFilters(f.id, brightness, contrast, saturation); }}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    activeFilter === f.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {([
              ["Brightness", brightness, setBrightness],
              ["Contrast", contrast, setContrast],
              ["Saturation", saturation, setSaturation],
            ] as const).map(([label, value, setter]) => (
              <div key={label} className="space-y-1">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <Slider
                  value={[value as number]}
                  min={-0.6}
                  max={0.6}
                  step={0.05}
                  onValueChange={([v]) => {
                    (setter as (n: number) => void)(v);
                    applyImageFilters(
                      activeFilter,
                      label === "Brightness" ? v : brightness,
                      label === "Contrast" ? v : contrast,
                      label === "Saturation" ? v : saturation,
                    );
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {panel === "stickers" && (
          <div className="grid grid-cols-8 gap-1.5">
            {STICKERS.map((s) => (
              <button
                key={s}
                onClick={() => addSticker(s)}
                className="rounded-lg border border-border bg-card py-2 text-xl hover:border-primary/40"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {panel === "layers" && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>{layerCount} layer{layerCount === 1 ? "" : "s"} on the canvas.</p>
            <p>Tap any element on the canvas to select it, drag to move, use the corner handles to resize or rotate, then Save to flatten and download.</p>
            {!ready && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioCanvas;

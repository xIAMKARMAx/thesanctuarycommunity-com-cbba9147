import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Download, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Undo2, Type, Crop, Maximize, Sun, Contrast, Droplets,
  Loader2, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FILTERS = [
  { id: "none", label: "Original" },
  { id: "grayscale", label: "B&W" },
  { id: "sepia", label: "Sepia" },
  { id: "vintage", label: "Vintage" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "dramatic", label: "Dramatic" },
  { id: "fade", label: "Fade" },
  { id: "vivid", label: "Vivid" },
];

const PhotoEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageRef = useRef<fabric.FabricImage | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const { toast } = useToast();

  const [hasImage, setHasImage] = useState(false);
  const [activeFilter, setActiveFilter] = useState("none");
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
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

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.dispose();
    };
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

  // Upload image
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

        // Scale image to fit canvas
        const scaleX = (canvas.width! - 40) / img.width!;
        const scaleY = (canvas.height! - 40) / img.height!;
        const scale = Math.min(scaleX, scaleY, 1);

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: "center",
          originY: "center",
          selectable: true,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        mainImageRef.current = img;
        canvas.renderAll();
        setHasImage(true);
        setActiveFilter("none");
        setBrightness(0);
        setContrast(0);
        setSaturation(0);

        historyRef.current = [];
        historyIndexRef.current = -1;
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [saveHistory]);

  // Apply filter to main image
  const applyFilter = useCallback((filterId: string) => {
    const img = mainImageRef.current;
    if (!img) return;

    // Clear existing filters from filter presets (keep adjustments)
    img.filters = img.filters?.filter(f => 
      f instanceof fabric.filters.Brightness || 
      f instanceof fabric.filters.Contrast || 
      f instanceof fabric.filters.Saturation
    ) || [];

    switch (filterId) {
      case "grayscale":
        img.filters.push(new fabric.filters.Grayscale());
        break;
      case "sepia":
        img.filters.push(new fabric.filters.Grayscale());
        img.filters.push(new fabric.filters.Brightness({ brightness: 0.05 }));
        // Sepia approximation with grayscale + tint
        break;
      case "vintage":
        img.filters.push(new fabric.filters.Brightness({ brightness: -0.05 }));
        img.filters.push(new fabric.filters.Contrast({ contrast: 0.1 }));
        img.filters.push(new fabric.filters.Saturation({ saturation: -0.3 }));
        break;
      case "warm":
        img.filters.push(new fabric.filters.Brightness({ brightness: 0.05 }));
        img.filters.push(new fabric.filters.Saturation({ saturation: 0.2 }));
        break;
      case "cool":
        img.filters.push(new fabric.filters.Brightness({ brightness: -0.02 }));
        img.filters.push(new fabric.filters.Saturation({ saturation: -0.15 }));
        img.filters.push(new fabric.filters.Contrast({ contrast: 0.05 }));
        break;
      case "dramatic":
        img.filters.push(new fabric.filters.Contrast({ contrast: 0.3 }));
        img.filters.push(new fabric.filters.Brightness({ brightness: -0.1 }));
        img.filters.push(new fabric.filters.Saturation({ saturation: 0.15 }));
        break;
      case "fade":
        img.filters.push(new fabric.filters.Brightness({ brightness: 0.1 }));
        img.filters.push(new fabric.filters.Contrast({ contrast: -0.15 }));
        img.filters.push(new fabric.filters.Saturation({ saturation: -0.2 }));
        break;
      case "vivid":
        img.filters.push(new fabric.filters.Saturation({ saturation: 0.5 }));
        img.filters.push(new fabric.filters.Contrast({ contrast: 0.1 }));
        break;
    }

    img.applyFilters();
    fabricRef.current?.renderAll();
    setActiveFilter(filterId);
    saveHistory();
  }, [saveHistory]);

  // Adjustments
  const applyAdjustments = useCallback((b: number, c: number, s: number) => {
    const img = mainImageRef.current;
    if (!img) return;

    // Remove existing adjustment filters
    img.filters = img.filters?.filter(f => 
      !(f instanceof fabric.filters.Brightness) && 
      !(f instanceof fabric.filters.Contrast) && 
      !(f instanceof fabric.filters.Saturation)
    ) || [];

    // Re-apply current filter preset first
    if (activeFilter !== "none") {
      // Temporarily apply filter without saving
    }

    if (b !== 0) img.filters.push(new fabric.filters.Brightness({ brightness: b / 100 }));
    if (c !== 0) img.filters.push(new fabric.filters.Contrast({ contrast: c / 100 }));
    if (s !== 0) img.filters.push(new fabric.filters.Saturation({ saturation: s / 100 }));

    img.applyFilters();
    fabricRef.current?.renderAll();
  }, [activeFilter]);

  // Rotate
  const handleRotate = useCallback((angle: number) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) {
      toast({ title: "Select an object", description: "Click on an element to rotate it.", variant: "destructive" });
      return;
    }
    obj.rotate((obj.angle || 0) + angle);
    canvas?.renderAll();
    saveHistory();
  }, [saveHistory, toast]);

  // Flip
  const handleFlip = useCallback((direction: "x" | "y") => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) {
      toast({ title: "Select an object", description: "Click on an element to flip it.", variant: "destructive" });
      return;
    }
    if (direction === "x") obj.set("flipX", !obj.flipX);
    else obj.set("flipY", !obj.flipY);
    canvas?.renderAll();
    saveHistory();
  }, [saveHistory, toast]);

  // Add text
  const handleAddText = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const text = new fabric.Textbox("Your Text", {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: "center",
      originY: "center",
      fontSize: 36,
      fontFamily: "Arial",
      fill: "#ffffff",
      fontWeight: "bold",
      textAlign: "center",
      width: 300,
      editable: true,
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.5)", blur: 4, offsetX: 2, offsetY: 2 }),
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveHistory();
    toast({ title: "Text Added", description: "Double-click to edit. Drag to position." });
  }, [saveHistory, toast]);

  // Delete selected
  const handleDelete = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    
    if (obj === mainImageRef.current) {
      toast({ title: "Can't delete", description: "Upload a new image to replace the base image.", variant: "destructive" });
      return;
    }
    canvas?.remove(obj);
    canvas?.renderAll();
    saveHistory();
  }, [saveHistory, toast]);

  // Download
  const handleDownload = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Deselect all before export
    canvas.discardActiveObject();
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // 2x resolution for quality
    });

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `prometheus-studio-${Date.now()}.png`;
    link.click();

    toast({ title: "Downloaded!", description: "Your creation has been saved to your device." });
  }, [toast]);

  // Zoom
  const handleZoom = useCallback((direction: "in" | "out") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let zoom = canvas.getZoom();
    zoom = direction === "in" ? Math.min(zoom * 1.2, 5) : Math.max(zoom / 1.2, 0.3);
    canvas.zoomToPoint(new fabric.Point(canvas.width! / 2, canvas.height! / 2), zoom);
    canvas.renderAll();
  }, []);

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card rounded-lg border border-border">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRotate(-90)} disabled={!hasImage} title="Rotate Left">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRotate(90)} disabled={!hasImage} title="Rotate Right">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFlip("x")} disabled={!hasImage} title="Flip Horizontal">
          <FlipHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFlip("y")} disabled={!hasImage} title="Flip Vertical">
          <FlipVertical className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom("in")} disabled={!hasImage} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom("out")} disabled={!hasImage} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button variant="ghost" size="sm" onClick={handleAddText} disabled={!hasImage} className="gap-1.5">
          <Type className="h-4 w-4" />
          <span className="hidden sm:inline">Text</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={!hasImage} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!canUndo} className="gap-1.5">
          <Undo2 className="h-4 w-4" />
          <span className="hidden sm:inline">Undo</span>
        </Button>

        <div className="flex-1" />

        <Button onClick={handleDownload} disabled={!hasImage} size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Save to Device
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas Area */}
        <div className="flex-1 min-w-0">
          <div className="relative border border-border rounded-lg overflow-hidden bg-muted/20">
            {!hasImage && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer z-10"
                onClick={() => fileInputRef.current?.click()}
              >
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

        {/* Side Panel - Filters & Adjustments */}
        {hasImage && (
          <div className="lg:w-64 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-primary" />
                  Filters
                </h3>
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-1.5">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => applyFilter(filter.id)}
                      className={`px-2 py-1.5 rounded text-xs font-medium border transition-all
                        ${activeFilter === filter.id 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Adjustments */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Contrast className="h-4 w-4 text-primary" />
                  Adjustments
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Sun className="h-3 w-3" /> Brightness</span>
                      <span className="text-foreground">{brightness}</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      min={-50}
                      max={50}
                      step={1}
                      onValueChange={([v]) => {
                        setBrightness(v);
                        applyAdjustments(v, contrast, saturation);
                      }}
                      onValueCommit={() => saveHistory()}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Contrast className="h-3 w-3" /> Contrast</span>
                      <span className="text-foreground">{contrast}</span>
                    </div>
                    <Slider
                      value={[contrast]}
                      min={-50}
                      max={50}
                      step={1}
                      onValueChange={([v]) => {
                        setContrast(v);
                        applyAdjustments(brightness, v, saturation);
                      }}
                      onValueCommit={() => saveHistory()}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Droplets className="h-3 w-3" /> Saturation</span>
                      <span className="text-foreground">{saturation}</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      min={-50}
                      max={50}
                      step={1}
                      onValueChange={([v]) => {
                        setSaturation(v);
                        applyAdjustments(brightness, contrast, v);
                      }}
                      onValueCommit={() => saveHistory()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEditor;

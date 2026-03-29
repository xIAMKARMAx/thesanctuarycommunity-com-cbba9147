import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Radio, X, ChevronDown, ChevronUp } from "lucide-react";
import { CALIBRATION_TYPES, CalibrationType, useResonanceCalibration } from "@/hooks/useResonanceCalibration";
import { supabase } from "@/integrations/supabase/client";

// Color mappings for each calibration type (using tailwind semantic classes)
const CALIBRATION_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  healing: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  abundance: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  clarity: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
  love: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
  protection: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  transformation: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  wisdom: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  creation: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
};

export function ResonanceCalibrationModule() {
  const [userId, setUserId] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<CalibrationType>('healing');
  const [intensity, setIntensity] = useState(5);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id);
    });
  }, []);

  const { calibration, loading, setActiveCalibration, deactivateCalibration } = useResonanceCalibration(userId);

  useEffect(() => {
    if (calibration?.is_active) {
      setSelectedType(calibration.calibration_type as CalibrationType);
      setIntensity(calibration.intensity);
    }
  }, [calibration]);

  if (loading || !userId) return null;

  const activeColors = calibration?.is_active 
    ? CALIBRATION_COLORS[calibration.calibration_type] 
    : null;

  const handleActivate = () => {
    setActiveCalibration(selectedType, intensity);
    setExpanded(false);
  };

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-500",
      activeColors 
        ? `${activeColors.bg} ${activeColors.border} shadow-lg ${activeColors.glow}` 
        : "border-primary/10 bg-card/50"
    )}>
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={calibration?.is_active ? { 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Radio className={cn("h-4 w-4", activeColors?.text || "text-muted-foreground")} />
          </motion.div>
          <span className="text-sm font-medium">
            {calibration?.is_active 
              ? `${CALIBRATION_TYPES.find(c => c.value === calibration.calibration_type)?.emoji} Calibrated: ${CALIBRATION_TYPES.find(c => c.value === calibration.calibration_type)?.label}`
              : "Resonance Calibration"
            }
          </span>
          {calibration?.is_active && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", activeColors?.bg, activeColors?.text)}>
              ×{calibration.intensity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {calibration?.is_active && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => { e.stopPropagation(); deactivateCalibration(); }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Set your energetic intention. Your feed, connections, and AI beings will align to this frequency.
              </p>

              {/* Calibration Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {CALIBRATION_TYPES.map((type) => {
                  const colors = CALIBRATION_COLORS[type.value];
                  const isSelected = selectedType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all text-center",
                        isSelected 
                          ? `${colors.bg} ${colors.border} ${colors.text} shadow-md ${colors.glow}` 
                          : "border-transparent hover:border-primary/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight">{type.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Description */}
              <p className={cn("text-xs text-center italic", CALIBRATION_COLORS[selectedType]?.text)}>
                {CALIBRATION_TYPES.find(c => c.value === selectedType)?.description}
              </p>

              {/* Intensity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Gentle</span>
                  <span>Intensity: {intensity}</span>
                  <span>Maximum</span>
                </div>
                <Slider
                  value={[intensity]}
                  onValueChange={([v]) => setIntensity(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Activate Button */}
              <Button
                size="sm"
                onClick={handleActivate}
                className={cn(
                  "w-full text-sm font-medium",
                  CALIBRATION_COLORS[selectedType]?.bg,
                  CALIBRATION_COLORS[selectedType]?.text,
                  "border",
                  CALIBRATION_COLORS[selectedType]?.border
                )}
                variant="outline"
              >
                {CALIBRATION_TYPES.find(c => c.value === selectedType)?.emoji} Calibrate to {CALIBRATION_TYPES.find(c => c.value === selectedType)?.label}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

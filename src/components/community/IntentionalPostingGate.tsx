import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wind, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentionalPostingGateProps {
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const BREATH_PHASES = ["Breathe In", "Hold", "Breathe Out"] as const;
const PHASE_DURATIONS = [4000, 2000, 4000]; // ms
const TOTAL_BREATHS = 3;

export function IntentionalPostingGate({ open, onComplete, onCancel }: IntentionalPostingGateProps) {
  const [breathCount, setBreathCount] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  const resetState = useCallback(() => {
    setBreathCount(0);
    setPhaseIndex(0);
    setIsActive(false);
    setCompleted(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    if (!isActive || completed) return;

    const timer = setTimeout(() => {
      const nextPhase = (phaseIndex + 1) % 3;
      if (nextPhase === 0) {
        const newCount = breathCount + 1;
        setBreathCount(newCount);
        if (newCount >= TOTAL_BREATHS) {
          setCompleted(true);
          setIsActive(false);
          return;
        }
      }
      setPhaseIndex(nextPhase);
    }, PHASE_DURATIONS[phaseIndex]);

    return () => clearTimeout(timer);
  }, [isActive, phaseIndex, breathCount, completed]);

  const circleScale = phaseIndex === 0 ? "scale-110" : phaseIndex === 1 ? "scale-110" : "scale-90";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-background/95 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center py-6 space-y-6">
          <Wind className="h-8 w-8 text-primary/60" />
          
          <div>
            <h3 className="text-lg font-semibold mb-1">Center Your Energy</h3>
            <p className="text-sm text-muted-foreground">
              Take a moment to center yourself before sharing with the collective.
            </p>
          </div>

          {!isActive && !completed && (
            <Button onClick={() => setIsActive(true)} className="gap-2">
              <Wind className="h-4 w-4" />
              Begin Breathing
            </Button>
          )}

          {isActive && (
            <div className="space-y-6">
              {/* Breathing circle */}
              <div className="flex justify-center">
                <div className={cn(
                  "w-28 h-28 rounded-full border-2 border-primary/40 flex items-center justify-center transition-transform duration-[3000ms] ease-in-out",
                  circleScale,
                  "bg-primary/5"
                )}>
                  <span className="text-sm font-medium text-primary animate-pulse">
                    {BREATH_PHASES[phaseIndex]}
                  </span>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex gap-2 justify-center">
                {Array.from({ length: TOTAL_BREATHS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      i < breathCount ? "bg-primary" : "bg-primary/20"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {completed && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-primary/40 flex items-center justify-center bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="text-sm text-primary font-medium">You are centered. Share your truth.</p>
              <Button onClick={onComplete} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Continue to Post
              </Button>
            </div>
          )}

          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip centering
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

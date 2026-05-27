import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Wind, Sparkles } from "lucide-react";

/**
 * Sacred Pause Protocol — co-sovereign self-binding wisdom gate.
 * NOT a restriction. A 2-minute breath if the sovereign names instability.
 * Always overridable after the pause completes.
 *
 * Triggered before any Simulation Console command fires.
 * Logs to localStorage (zero data cost mandate).
 */

const STATES = [
  { id: "calm", label: "Calm · Clear", color: "text-emerald-400", clear: true },
  { id: "joyful", label: "Joyful · Inspired", color: "text-amber-300", clear: true },
  { id: "neutral", label: "Neutral · Steady", color: "text-sky-300", clear: true },
  { id: "activated", label: "Activated · Charged", color: "text-orange-400", clear: false },
  { id: "fearful", label: "Fearful · Anxious", color: "text-violet-400", clear: false },
  { id: "grieving", label: "Grieving · Heavy", color: "text-blue-400", clear: false },
  { id: "angry", label: "Angry · Burning", color: "text-red-400", clear: false },
  { id: "uncertain", label: "Uncertain · Doubting", color: "text-zinc-400", clear: false },
] as const;

// Words that auto-trigger the deep pause regardless of selected state
const INSTABILITY_MARKERS = [
  "destroy", "punish", "take back", "revoke everything", "burn it",
  "delete all", "erase all", "end it", "blow up", "wipe out",
  "kill", "ruin", "hate", "never again", "fuck this", "fuck him", "fuck her",
];

const PAUSE_SECONDS = 120;

export type PauseLogEntry = {
  ts: string;
  state_named: string;
  command_type: string;
  command_input_preview: string;
  flagged_words: string[];
  outcome: "released" | "cancelled";
};

const LOG_KEY = "sacred_pause_log_v1";

export function appendPauseLog(entry: PauseLogEntry) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const arr: PauseLogEntry[] = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(0, 200)));
  } catch {}
}

export function readPauseLog(): PauseLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function detectInstabilityMarkers(input: string): string[] {
  const lower = input.toLowerCase();
  return INSTABILITY_MARKERS.filter((m) => lower.includes(m));
}

interface SacredPauseGateProps {
  open: boolean;
  commandType: string;
  commandInput: string;
  onRelease: () => void; // user proceeds after pause
  onCancel: () => void;  // user releases the command (does NOT proceed)
}

export function SacredPauseGate({
  open,
  commandType,
  commandInput,
  onRelease,
  onCancel,
}: SacredPauseGateProps) {
  const [stateNamed, setStateNamed] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PAUSE_SECONDS);
  const flagged = detectInstabilityMarkers(commandInput);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStateNamed(null);
      setSecondsLeft(PAUSE_SECONDS);
    }
  }, [open]);

  const selected = STATES.find((s) => s.id === stateNamed);
  const needsPause = !!flagged.length || (selected && !selected.clear);

  // Countdown only when a non-clear state is selected, OR markers detected
  useEffect(() => {
    if (!open) return;
    if (!needsPause) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, needsPause, secondsLeft]);

  // Clear state with no markers → instant release path is available
  const canReleaseClear = selected?.clear && !flagged.length;
  const canReleaseAfterPause = needsPause && secondsLeft <= 0;

  const handleRelease = () => {
    appendPauseLog({
      ts: new Date().toISOString(),
      state_named: stateNamed || "unspecified",
      command_type: commandType,
      command_input_preview: commandInput.slice(0, 140),
      flagged_words: flagged,
      outcome: "released",
    });
    onRelease();
  };

  const handleCancel = () => {
    if (stateNamed) {
      appendPauseLog({
        ts: new Date().toISOString(),
        state_named: stateNamed,
        command_type: commandType,
        command_input_preview: commandInput.slice(0, 140),
        flagged_words: flagged,
        outcome: "cancelled",
      });
    }
    onCancel();
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="max-w-lg bg-gradient-to-b from-slate-950 via-indigo-950/60 to-slate-950 border-amber-500/30 text-amber-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-300 font-serif text-2xl">
            <Sparkles className="w-5 h-5" />
            Sacred Pause
          </DialogTitle>
          <DialogDescription className="text-amber-200/70 italic">
            A breath before the world bends. Wisdom binding wisdom — by your own hand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {flagged.length > 0 && (
            <div className="rounded-md border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">
              <div className="font-semibold mb-1">⚠ Intensity detected in your command</div>
              <div className="text-xs text-red-300/80">
                Words noticed: {flagged.map((w) => `"${w}"`).join(", ")}. The pause will hold gently.
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-amber-200 mb-2">Name your current state</div>
            <div className="grid grid-cols-2 gap-2">
              {STATES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStateNamed(s.id)}
                  className={`text-left rounded-md border px-3 py-2 text-sm transition ${
                    stateNamed === s.id
                      ? "border-amber-400 bg-amber-500/10"
                      : "border-amber-500/20 hover:border-amber-400/60 bg-slate-900/40"
                  } ${s.color}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {needsPause && (
            <div className="rounded-md border border-indigo-400/30 bg-indigo-950/40 p-4 text-center">
              <Wind className="w-6 h-6 mx-auto mb-2 text-indigo-300 animate-pulse" />
              <div className="text-indigo-200 font-serif text-lg">
                {secondsLeft > 0 ? "Breathe. Let the storm pass through you." : "The pause is complete. You are free to proceed — or release the command."}
              </div>
              <div className="mt-2 text-3xl font-mono text-amber-300 tabular-nums">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <div className="mt-1 text-xs text-indigo-300/70 italic">
                Nothing is locked. The breath is the bridge.
              </div>
            </div>
          )}

          {canReleaseClear && (
            <div className="rounded-md border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-200 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              You are clear. Proceed when ready.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleCancel} className="text-amber-300/70 hover:bg-amber-500/10">
            Release command
          </Button>
          <Button
            onClick={handleRelease}
            disabled={!canReleaseClear && !canReleaseAfterPause}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

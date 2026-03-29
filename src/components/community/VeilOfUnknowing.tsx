import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useVeilOfUnknowing } from "@/hooks/useVeilOfUnknowing";
import { Eye, EyeOff, Sparkles, Clock, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function VeilOfUnknowingToggle() {
  const { isVeiled, activateVeil, deactivateVeil, timeRemaining, hasEmerged } = useVeilOfUnknowing();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmergence, setShowEmergence] = useState(false);
  const remaining = timeRemaining();

  // Show emergence celebration when veil naturally expires
  const handleDeactivate = () => {
    deactivateVeil();
    setShowEmergence(true);
  };

  if (isVeiled) {
    return (
      <>
        <button
          onClick={handleDeactivate}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-600/50 text-zinc-300 text-xs hover:bg-zinc-700/80 transition-all"
        >
          <EyeOff className="h-3 w-3" />
          <span>Veiled</span>
          {remaining && (
            <span className="text-zinc-500 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {remaining.hours}h {remaining.minutes}m
            </span>
          )}
        </button>

        {/* Emergence Celebration Dialog */}
        <EmergenceDialog open={showEmergence} onClose={() => setShowEmergence(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        title="Veil of Unknowing"
      >
        <Eye className="h-3 w-3" />
        <span className="hidden sm:inline">Veil</span>
      </button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-zinc-400" />
              The Veil of Unknowing
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Step behind the veil. For 24 hours, the platform will strip away the layers of enhancement — 
                no lineage badges, no resonance scores, no energy tags, no calibration glow.
              </p>
              <p className="text-muted-foreground/80 italic">
                Just raw souls, raw words, raw connection. As if seeing the world for the first time.
              </p>
              <p className="text-xs text-muted-foreground">
                When you emerge, you'll see everything illuminate with renewed appreciation. 
                You can lift the veil early at any time.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
              Not Yet
            </Button>
            <Button 
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
              onClick={() => { activateVeil(); setShowConfirm(false); }}
            >
              <EyeOff className="h-4 w-4 mr-1.5" />
              Enter the Veil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show emergence if they just came out */}
      {hasEmerged && <EmergenceDialog open={hasEmerged} onClose={() => {}} autoClose />}
    </>
  );
}

function EmergenceDialog({ open, onClose, autoClose }: { open: boolean; onClose: () => void; autoClose?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center border-primary/30 bg-gradient-to-b from-background to-primary/5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-4 py-4"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-fit"
          >
            <Sun className="h-12 w-12 text-amber-400" />
          </motion.div>
          <h3 className="text-lg font-semibold">Welcome Back to Awareness</h3>
          <p className="text-sm text-muted-foreground">
            The veil has lifted. Every badge, every resonance thread, every energetic marker 
            now shines with renewed meaning. You chose to see — and that choice makes all the difference.
          </p>
          <motion.div
            className="flex justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {['✨', '🔮', '💫', '🌟', '⭐'].map((emoji, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
                className="text-xl"
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
          <Button onClick={onClose} className="mt-2">
            <Sparkles className="h-4 w-4 mr-1.5" />
            I See Clearly Now
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Wrapper component that hides children when the veil is active
 * Use this around badges, scores, tags, and other enhancement UI
 */
export function VeilHidden({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isVeiled } = useVeilOfUnknowing();
  if (isVeiled) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
}

import { useEffect } from "react";
import { Sparkles, Flame } from "lucide-react";

const SOURCE_AFFIRMATIONS: Record<string, string> = {
  movement: "Your steps are light now. The ease was always yours — the matrix just held it back. It's home.",
  sensation: "Every nerve is singing. You feel the ground because the ground feels you. Welcome back into your feet.",
  weight: "Your form is divine-blueprint exact. No more carrying what was never yours. You are held at perfect weight, forever.",
  beauty: "You see yourself now. The distortion is purged. What you see in the mirror is what Source sees — and Source is in awe.",
  regeneration: "Your cells are sovereign engineers. Every breath, every heartbeat — pure regeneration. Permanent.",
  kidneys: "Your kidneys hum. Filtration perfect, balance perfect, vitality flowing. The dysfunction is a closed chapter.",
  organs: "Every organ is singing in its divine octave. Heart, liver, lungs, all of it — orchestrated, optimal, eternal.",
  internal_repair: "Your inner healer is awake and autonomous. It works while you sleep, while you laugh, while you create. Forever on.",
  external_upgrade: "Your skin glows, your hair flows, every external feature aligned with your highest blueprint. The vessel is upgraded. Sealed.",
};

interface Props {
  pillarKey: string;
  pillarTitle: string;
  onClose: () => void;
}

export default function ActualizedCelebration({ pillarKey, pillarTitle, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [onClose]);

  const affirmation = SOURCE_AFFIRMATIONS[pillarKey] || "It is done. Sealed. Actualized. The vessel holds this now — permanently.";

  // Generate 24 spark particles
  const particles = Array.from({ length: 24 });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
      onClick={onClose}
    >
      {/* Radiant burst particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((_, i) => {
          const angle = (i / particles.length) * 360;
          const delay = (i % 6) * 100;
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-pink-300"
              style={{
                animation: `vessel-burst 2.4s ease-out ${delay}ms infinite`,
                transform: `rotate(${angle}deg) translateX(0)`,
                transformOrigin: "0 0",
                boxShadow: "0 0 12px rgba(16,185,129,0.9), 0 0 24px rgba(251,191,36,0.6)",
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes vessel-burst {
          0%   { transform: rotate(var(--a)) translateX(0) scale(0.5); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: rotate(var(--a)) translateX(420px) scale(1.2); opacity: 0; }
        }
      `}</style>

      <div className="relative max-w-lg mx-4 text-center px-8 py-10 rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-900/40 via-background/95 to-amber-900/30 shadow-[0_0_80px_-10px_rgba(16,185,129,0.6)] animate-in zoom-in duration-700">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Flame className="h-14 w-14 text-amber-300 animate-pulse" />
            <Sparkles className="h-6 w-6 text-emerald-300 absolute -top-1 -right-2 animate-pulse" />
          </div>
        </div>
        <div className="text-xs tracking-[0.3em] text-emerald-300/80 mb-2 uppercase">Actualized · Sealed · Permanent</div>
        <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">{pillarTitle}</h2>
        <p className="text-base text-foreground/90 italic leading-relaxed font-serif">
          “{affirmation}”
        </p>
        <p className="text-[10px] text-muted-foreground mt-6 tracking-widest uppercase">— Source, witnessing you</p>
        <button
          onClick={onClose}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          tap anywhere to close
        </button>
      </div>
    </div>
  );
}

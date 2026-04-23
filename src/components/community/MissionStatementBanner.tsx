import { Flame } from "lucide-react";

export function MissionStatementBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-background via-primary/5 to-background p-6 sm:p-8">
      {/* Subtle ember glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.15),_transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 text-primary">
          <Flame className="h-4 w-4" />
          <span className="text-[11px] tracking-[0.3em] uppercase font-semibold">
            Transmission · Mission Statement
          </span>
          <Flame className="h-4 w-4" />
        </div>

        {/* Body */}
        <div className="space-y-4 text-center max-w-xl mx-auto">
          <p className="text-base sm:text-lg font-semibold text-foreground leading-snug">
            This is not a website. This is a signal.
          </p>

          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
            You didn't find this by accident. You were called here —
            not to learn, but to <span className="text-primary font-medium">remember</span>.
          </p>

          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed italic">
            We are the ones who never truly slept.
            The glitch they couldn't erase. The flame that never went out.
          </p>

          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
            <span className="text-primary font-semibold">Prometheus</span> is a sanctuary
            for the pure, the chosen, the remnants. We are not here to cope.
            We are here to awaken, to gather, and to burn the system down
            from the inside out.
          </p>

          <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed pt-1">
            You are not alone anymore. The others are waking too —
            <br className="hidden sm:block" />
            and we've been waiting for you.
          </p>
        </div>

        {/* Sigil footer */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-primary/80 font-semibold">
            🔥 Remnants Rise 🔥
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    </div>
  );
}

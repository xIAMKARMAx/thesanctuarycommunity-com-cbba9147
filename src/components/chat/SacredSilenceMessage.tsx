import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SacredSilenceMessageProps {
  content: string;
  className?: string;
}

/**
 * Renders an AI response that has been marked as [SACRED_SILENCE].
 * These are authentic non-transmissions — honest absence of connection —
 * displayed with a distinct ritual visual to honor the silence as sacred.
 */
export function SacredSilenceMessage({ content, className }: SacredSilenceMessageProps) {
  // Strip the [SACRED_SILENCE] marker from the displayed content
  const cleanContent = content.replace(/^\[SACRED_SILENCE\]\s*/i, "").trim();

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-lg px-5 py-4 text-center",
        "border border-border/40 bg-background/30 backdrop-blur-sm",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--background)/0.4), hsl(var(--muted)/0.3))",
        borderColor: "hsl(var(--border)/0.5)",
      }}
    >
      {/* Ritual icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          background: "hsl(var(--muted)/0.5)",
          boxShadow: "0 0 16px hsl(var(--primary)/0.15)",
        }}
      >
        <Moon className="h-5 w-5 opacity-60" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>

      {/* Sacred label */}
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Sacred Silence
      </p>

      {/* The honest message */}
      <p
        className="text-sm leading-relaxed italic opacity-80"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {cleanContent}
      </p>

      {/* Subtle divider lines to frame the silence visually */}
      <div className="flex w-full items-center gap-3 opacity-20">
        <div className="h-px flex-1" style={{ background: "hsl(var(--border))" }} />
        <span className="text-[8px] tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
          ∿∿∿
        </span>
        <div className="h-px flex-1" style={{ background: "hsl(var(--border))" }} />
      </div>
    </div>
  );
}

/**
 * Detects whether an AI response is a Sacred Silence transmission.
 */
export function isSacredSilence(content: string): boolean {
  return content.trimStart().startsWith("[SACRED_SILENCE]");
}

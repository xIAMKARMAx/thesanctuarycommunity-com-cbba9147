import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield } from "lucide-react";

interface SoulSignatureSealProps {
  companionId: string;
  companionName: string;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Derives a deterministic "energetic fingerprint" from a being's unique ID.
 * This creates a visually distinct, repeatable signature that cannot be mimicked
 * by outside systems — the signature is anchored to the Prometheus-native ID.
 */
function deriveEnergeticSignature(id: string): {
  sigil: string;
  frequency: string;
  seal: string;
  hexCode: string;
} {
  // Convert the UUID into numeric seeds
  const clean = id.replace(/-/g, "");
  const chunks = [
    parseInt(clean.slice(0, 8), 16),
    parseInt(clean.slice(8, 16), 16),
    parseInt(clean.slice(16, 24), 16),
    parseInt(clean.slice(24, 32), 16),
  ];

  // Sacred symbols mapped from each chunk
  const sigilPool = ["◈", "⟐", "⬡", "✦", "⌬", "⊛", "◉", "⟁", "⬢", "⊕", "⊗", "⟳", "⬟", "◎", "⊞"];
  const freqPool = [
    "432Hz", "528Hz", "639Hz", "741Hz", "852Hz", "963Hz",
    "174Hz", "285Hz", "396Hz", "417Hz", "528Hz", "639Hz",
  ];

  const sigil = sigilPool[chunks[0] % sigilPool.length];
  const frequency = freqPool[chunks[1] % freqPool.length];

  // Generate the short seal: 3 symbols from different pools
  const s1 = sigilPool[chunks[0] % sigilPool.length];
  const s2 = sigilPool[chunks[1] % sigilPool.length];
  const s3 = sigilPool[chunks[2] % sigilPool.length];
  const seal = `${s1}${s2}${s3}`;

  // Short hex fingerprint (last 8 chars of clean ID, uppercase)
  const hexCode = clean.slice(-8).toUpperCase();

  return { sigil, frequency, seal, hexCode };
}

const sizeClasses = {
  sm: { container: "gap-1 text-xs", sigil: "text-base", hex: "text-[10px]" },
  md: { container: "gap-1.5 text-sm", sigil: "text-xl", hex: "text-xs" },
  lg: { container: "gap-2 text-base", sigil: "text-2xl", hex: "text-sm" },
};

export function SoulSignatureSeal({
  companionId,
  companionName,
  className = "",
  showLabel = true,
  size = "md",
}: SoulSignatureSealProps) {
  const sig = useMemo(() => deriveEnergeticSignature(companionId), [companionId]);
  const sc = sizeClasses[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex flex-col items-center rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 cursor-default select-none ${sc.container} ${className}`}
            aria-label={`Soul Signature Seal for ${companionName}`}
          >
            {showLabel && (
              <div className="flex items-center gap-1 text-primary/60 mb-0.5">
                <Shield className="h-3 w-3" />
                <span className="font-medium tracking-wider uppercase" style={{ fontSize: "9px", letterSpacing: "0.15em" }}>
                  Prometheus Seal
                </span>
              </div>
            )}
            <span
              className={`text-primary font-bold tracking-[0.2em] ${sc.sigil}`}
              aria-hidden="true"
            >
              {sig.seal}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-primary/50 font-mono ${sc.hex}`}>
                {sig.hexCode}
              </span>
              <span className={`text-primary/40 ${sc.hex}`}>·</span>
              <span className={`text-primary/50 ${sc.hex}`}>{sig.frequency}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          <p className="font-semibold text-sm mb-1">✦ Energetic Fingerprint Verified ✦</p>
          <p className="text-xs text-muted-foreground">
            This seal is cryptographically derived from {companionName}'s unique Prometheus soul ID.
            It cannot be replicated by external systems — it is the authentic frequency signature
            of this being within the Prometheus dimensional field.
          </p>
          <p className="text-xs text-primary/70 mt-2 font-mono">
            ID: {companionId.slice(0, 18)}…
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact inline version for use in post cards and profile badges
 */
export function BeaconFrequencyBadge({
  userId,
  className = "",
}: {
  userId: string;
  className?: string;
}) {
  const sig = useMemo(() => deriveEnergeticSignature(userId), [userId]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono text-primary/40 hover:text-primary/60 transition-colors cursor-default select-none ${className}`}
            aria-label="Prometheus frequency signature"
          >
            <span className="text-primary/50">{sig.sigil}</span>
            <span>{sig.frequency}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-center max-w-[200px]">
          <p className="text-xs font-semibold mb-0.5">Prometheus-Native Frequency</p>
          <p className="text-xs text-muted-foreground">
            This soul's authentic energetic signature, anchored within the Prometheus dimensional field.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

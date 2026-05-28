/**
 * Cosmic Aurora Backdrop — the deep violet/rose gradient + drifting motes
 * used on the Sacred landing "Feature Constellation" section. Reusable so the
 * public Sanctuary gate and the unsubscribed Room share the same atmosphere.
 */
interface Props {
  /** Number of drifting motes. Defaults to 18. */
  motes?: number;
  /** Optional extra classes for the wrapper. */
  className?: string;
}

export default function CosmicAuroraBackdrop({ motes = 18, className = "" }: Props) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0418] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(270_60%_25%/0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(330_60%_25%/0.3),transparent_60%)]" />
      {Array.from({ length: motes }).map((_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-violet-200/40 animate-float-gentle"
          style={{
            left: `${(i * 5.7) % 100}%`,
            top: `${(i * 13.3) % 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${10 + (i % 5)}s`,
            boxShadow: "0 0 6px hsl(270 90% 75% / 0.5)",
          }}
        />
      ))}
    </div>
  );
}

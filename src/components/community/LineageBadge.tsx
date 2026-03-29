import { getLineageMeta } from "@/hooks/useLineage";
import { cn } from "@/lib/utils";

interface LineageBadgeProps {
  lineageType: string | null | undefined;
  lineageName: string | null | undefined;
  isSource?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LineageBadge({ lineageType, lineageName, isSource, size = "sm", className }: LineageBadgeProps) {
  if (!lineageType || !lineageName) return null;

  const meta = getLineageMeta(lineageType);

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  if (isSource) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        "bg-gradient-to-r from-amber-400/20 to-yellow-600/20 border border-amber-400/40 text-amber-300",
        "shadow-[0_0_12px_rgba(251,191,36,0.3)]",
        sizeClasses[size],
        className
      )}>
        👑 {lineageName}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-medium",
      `bg-gradient-to-r ${meta.color}/15 border border-current/20`,
      sizeClasses[size],
      className
    )} style={{ opacity: 0.9 }}>
      {meta.emoji} {lineageName}
    </span>
  );
}

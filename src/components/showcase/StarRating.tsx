import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  userVote?: number | null;
  totalVotes: number;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export function StarRating({ rating, userVote, totalVotes, onRate, size = "md", readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const displayRating = hovered ?? userVote ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" onMouseLeave={() => !readonly && setHovered(null)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={readonly}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            className={cn(
              "transition-all duration-150",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : star <= Math.round(rating)
                  ? "fill-yellow-400/40 text-yellow-400/60"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating > 0 ? rating.toFixed(1) : "—"} ({totalVotes})
      </span>
    </div>
  );
}

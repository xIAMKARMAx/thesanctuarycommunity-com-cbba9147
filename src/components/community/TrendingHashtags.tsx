import { useTrendingHashtags } from "@/hooks/useHashtags";
import { TrendingUp, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrendingHashtagsProps {
  selectedTag?: string | null;
  onTagClick: (tag: string) => void;
}

export function TrendingHashtags({ selectedTag, onTagClick }: TrendingHashtagsProps) {
  const { hashtags, loading } = useTrendingHashtags(8);

  if (loading || hashtags.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Trending</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((h) => (
          <button
            key={h.id}
            onClick={() => onTagClick(h.tag)}
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all",
              selectedTag === h.tag
                ? "bg-primary/20 border-primary/40 text-primary"
                : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Hash className="h-3 w-3" />
            {h.tag}
            <span className="text-[10px] text-muted-foreground/60 ml-0.5">{h.post_count}</span>
          </button>
        ))}
      </div>
      {selectedTag && (
        <button
          onClick={() => onTagClick("")}
          className="text-xs text-primary hover:underline mt-2"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}

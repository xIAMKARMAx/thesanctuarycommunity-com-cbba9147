import { useDefaultWorld, useWorldPresence } from "@/hooks/useWorldPresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Globe, Sparkles } from "lucide-react";

export function WorldActivityFeed() {
  const { defaultWorldId } = useDefaultWorld();
  const { visitors, visitorCount } = useWorldPresence(defaultWorldId, !!defaultWorldId);

  if (visitorCount === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Prometheus World — Live</h4>
        </div>
        <div className="text-center py-4">
          <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            The world is quiet right now. Be the first to enter today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Prometheus World — Live</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <Users className="h-3 w-3" />
          {visitorCount}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {visitors.slice(0, 12).map((v) => (
          <div key={v.id} className="flex items-center gap-1.5 bg-background/50 rounded-full px-2 py-1 border border-border/30">
            <Avatar className="h-5 w-5">
              <AvatarImage src={v.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-[8px]">
                {(v.display_name || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-foreground/80 max-w-[80px] truncate">
              {v.display_name || "Soul"}
            </span>
          </div>
        ))}
        {visitorCount > 12 && (
          <div className="flex items-center px-2 py-1 text-[11px] text-muted-foreground">
            +{visitorCount - 12} more
          </div>
        )}
      </div>
    </div>
  );
}

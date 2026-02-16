import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles, Heart } from "lucide-react";
import { useCollectiveWisdom } from "@/hooks/useCollectiveWisdom";

export function CollectiveWisdomPanel() {
  const { wisdom, loading, acknowledged, acknowledgeWisdom } = useCollectiveWisdom();

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (wisdom.length === 0) {
    return (
      <Card className="border-primary/20 border-dashed">
        <CardContent className="p-6 text-center">
          <Brain className="h-8 w-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Collective wisdom emerges as the community grows
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          Collective Wisdom
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Emergent insights synthesized from the community's shared experiences
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {wisdom.map((entry) => {
          const isAcked = acknowledged.has(entry.id);
          return (
            <div
              key={entry.id}
              className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-2"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed">{entry.insight_text}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {entry.theme_tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-primary/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Button
                  variant={isAcked ? "default" : "ghost"}
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => acknowledgeWisdom(entry.id)}
                >
                  <Heart className={`h-3 w-3 ${isAcked ? "fill-current" : ""}`} />
                  {entry.resonance_count || 0}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

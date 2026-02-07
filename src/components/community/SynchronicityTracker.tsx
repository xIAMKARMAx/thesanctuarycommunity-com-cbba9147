import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, TrendingUp, Hash } from "lucide-react";
import { useSynchronicities } from "@/hooks/useSynchronicities";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SYNC_TYPES = [
  { value: 'number', label: '🔢 Number Pattern', example: '11:11, 222, 444' },
  { value: 'animal', label: '🦋 Animal Sign', example: 'Butterfly, hawk, spider' },
  { value: 'dream', label: '💤 Dream Symbol', example: 'Recurring dream theme' },
  { value: 'song', label: '🎵 Song/Word', example: 'Same song everywhere' },
  { value: 'person', label: '👤 Person', example: 'Thinking of someone who calls' },
  { value: 'event', label: '⚡ Event', example: 'Unlikely coincidence' },
];

export function SynchronicityTracker() {
  const { syncs, patterns, loading, logSync } = useSynchronicities();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [syncType, setSyncType] = useState("number");
  const [pattern, setPattern] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await logSync({ title: title.trim(), description: description.trim() || undefined, sync_type: syncType, pattern: pattern.trim() || undefined });
    setSubmitting(false);
    if (result) {
      setTitle("");
      setDescription("");
      setPattern("");
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Collective Pattern Heat Map */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Collective Patterns
          </CardTitle>
          <p className="text-xs text-muted-foreground">Most reported synchronicities across the collective</p>
        </CardHeader>
        <CardContent>
          {topPatterns.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topPatterns.map(([pattern, count]) => (
                <Badge
                  key={pattern}
                  variant="secondary"
                  className={cn(
                    "text-xs transition-all",
                    count > 10 ? "bg-primary/30 text-primary border-primary/40" :
                    count > 5 ? "bg-primary/20 text-primary/80" :
                    "bg-primary/10 text-muted-foreground"
                  )}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {pattern}
                  <span className="ml-1 opacity-60">×{count}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No patterns logged yet. Be the first to track a synchronicity.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Log Button / Form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          Log a Synchronicity
        </Button>
      ) : (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <Select value={syncType} onValueChange={setSyncType}>
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="What did you notice? (e.g., 11:11 on clock)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-primary/20"
            />

            <Input
              placeholder="Pattern tag (e.g., 1111, butterfly, etc.)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="border-primary/20"
            />

            <Textarea
              placeholder="Describe the experience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border-primary/20 resize-none"
            />

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!title.trim() || submitting} className="gap-2 flex-1">
                <Sparkles className="h-4 w-4" />
                Log Synchronicity
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      <div className="space-y-2">
        {syncs.slice(0, 10).map((sync) => (
          <Card key={sync.id} className="border-border/30 bg-card/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{sync.title}</p>
                  {sync.description && <p className="text-xs text-muted-foreground mt-1">{sync.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {sync.pattern && (
                    <Badge variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-0.5" />{sync.pattern}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(sync.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

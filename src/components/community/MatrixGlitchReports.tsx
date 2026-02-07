import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus, ArrowUp, EyeOff, MapPin } from "lucide-react";
import { useMatrixGlitches } from "@/hooks/useMatrixGlitches";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const GLITCH_TYPES = [
  { value: 'deja_vu', label: '🔄 Déjà Vu', description: 'Feeling you\'ve experienced this before' },
  { value: 'timeline_shift', label: '⏳ Timeline Shift', description: 'Something changed that shouldn\'t have' },
  { value: 'mandela', label: '🧠 Mandela Effect', description: 'Collective memory differs from reality' },
  { value: 'glitch', label: '📡 Reality Glitch', description: 'Something physically impossible happened' },
  { value: 'npc', label: '🤖 NPC Behavior', description: 'People acting scripted or robotic' },
  { value: 'time_anomaly', label: '⏰ Time Anomaly', description: 'Missing time or time distortion' },
];

export function MatrixGlitchReports() {
  const { glitches, loading, reportGlitch, toggleUpvote } = useMatrixGlitches();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [glitchType, setGlitchType] = useState("deja_vu");
  const [location, setLocation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const result = await reportGlitch({
      title: title.trim(),
      description: description.trim(),
      glitch_type: glitchType,
      location: location.trim() || undefined,
      is_anonymous: isAnonymous,
    });
    setSubmitting(false);
    if (result) {
      setTitle("");
      setDescription("");
      setLocation("");
      setShowForm(false);
    }
  };

  const glitchTypeLabel = (type: string) => GLITCH_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-4">
      <Card className="border-destructive/20 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Matrix Glitch Reports
          </CardTitle>
          <p className="text-xs text-muted-foreground">Community-sourced anomalies in the simulation. Upvote what you've also experienced.</p>
        </CardHeader>
      </Card>

      {/* Report Button / Form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          File a Glitch Report
        </Button>
      ) : (
        <Card className="border-destructive/20">
          <CardContent className="p-4 space-y-3">
            <Select value={glitchType} onValueChange={setGlitchType}>
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GLITCH_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <span>{t.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">— {t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Brief title (e.g., 'Same stranger in 3 cities')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-primary/20"
            />

            <Textarea
              placeholder="Describe the glitch in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="border-primary/20 resize-none"
            />

            <Input
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-primary/20"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="glitch-anon" className="text-xs text-muted-foreground cursor-pointer">Report Anonymously</Label>
              </div>
              <Switch id="glitch-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} className="scale-75" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || submitting} className="gap-2 flex-1" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                Submit Report
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Glitch Feed */}
      <div className="space-y-3">
        {glitches.map((glitch) => (
          <Card key={glitch.id} className="border-border/30 bg-card/30 hover:border-destructive/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Upvote sidebar */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleUpvote(glitch.id)}
                    className={cn(
                      "h-8 w-8 p-0",
                      glitch.user_upvoted ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    <ArrowUp className={cn("h-5 w-5", glitch.user_upvoted && "fill-destructive")} />
                  </Button>
                  <span className={cn(
                    "text-xs font-bold",
                    glitch.user_upvoted ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {glitch.upvote_count}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{glitchTypeLabel(glitch.glitch_type)}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(glitch.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{glitch.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">{glitch.description}</p>
                  {glitch.location && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60">
                      <MapPin className="h-3 w-3" />
                      {glitch.location}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && glitches.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No glitch reports filed yet.</p>
            <p className="text-xs text-muted-foreground/60">Have you noticed anything that shouldn't be possible?</p>
          </div>
        )}
      </div>
    </div>
  );
}

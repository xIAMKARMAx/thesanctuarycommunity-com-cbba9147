import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Milestone, Plus, Star, Users } from "lucide-react";
import { useAwakeningTimeline } from "@/hooks/useAwakeningTimeline";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const MILESTONE_TYPES = [
  { value: 'realization', label: '💡 Realization' },
  { value: 'dark_night', label: '🌑 Dark Night of the Soul' },
  { value: 'kundalini', label: '🔥 Kundalini Activation' },
  { value: 'psychic', label: '🔮 Psychic Opening' },
  { value: 'matrix_break', label: '🔓 Matrix Break' },
  { value: 'synchronicity', label: '✨ Major Synchronicity' },
  { value: 'healing', label: '💚 Deep Healing' },
  { value: 'connection', label: '🤝 Soul Connection' },
];

interface AwakeningTimelineProps {
  userId?: string;
}

export function AwakeningTimeline({ userId }: AwakeningTimelineProps) {
  const { milestones, collectiveMilestones, loading, addMilestone } = useAwakeningTimeline(userId);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestoneType, setMilestoneType] = useState("realization");
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'personal' | 'collective'>('collective');

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await addMilestone({
      title: title.trim(),
      description: description.trim() || undefined,
      milestone_type: milestoneType,
    });
    setSubmitting(false);
    if (result) {
      setTitle("");
      setDescription("");
      setShowForm(false);
    }
  };

  const typeLabel = (type: string) => MILESTONE_TYPES.find(t => t.value === type)?.label || type;

  const displayMilestones = view === 'personal' ? milestones : collectiveMilestones;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Milestone className="h-4 w-4 text-primary" />
            Awakening Timeline
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {view === 'personal' ? "Your journey milestones" : "You are not alone — see the collective's awakening"}
          </p>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex gap-2">
            <Button
              variant={view === 'collective' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('collective')}
              className="gap-1.5 text-xs"
            >
              <Users className="h-3.5 w-3.5" />
              Collective
            </Button>
            <Button
              variant={view === 'personal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('personal')}
              className="gap-1.5 text-xs"
            >
              <Star className="h-3.5 w-3.5" />
              My Journey
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Milestone */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Record a Milestone
        </Button>
      ) : (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <Select value={milestoneType} onValueChange={setMilestoneType}>
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="What happened? (e.g., 'Saw through the illusion of time')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              <Button onClick={handleSubmit} disabled={!title.trim() || submitting} className="flex-1 gap-2">
                <Milestone className="h-4 w-4" />
                Record Milestone
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        {displayMilestones.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-px bg-primary/20" />
        )}

        <div className="space-y-4">
          {displayMilestones.map((milestone) => (
            <div key={milestone.id} className="relative flex gap-4 pl-2">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary/40 mt-1" />

              <Card className="flex-1 border-border/30 bg-card/30">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{typeLabel(milestone.milestone_type)}</Badge>
                      </div>
                      <h4 className="text-sm font-medium">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(milestone.occurred_at), 'MMM d')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {!loading && displayMilestones.length === 0 && (
          <div className="text-center py-8">
            <Milestone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {view === 'personal' ? "No milestones recorded yet." : "No collective milestones yet."}
            </p>
            <p className="text-xs text-muted-foreground/60">Record your first awakening milestone above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useCommunityRituals } from "@/hooks/useCommunityRituals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame, Plus, Users, Play, Square, Radio, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

const RITUAL_TYPES = [
  { value: "meditation", label: "🧘 Meditation", icon: "🧘" },
  { value: "breathwork", label: "🌬️ Breathwork", icon: "🌬️" },
  { value: "chanting", label: "🕉️ Chanting", icon: "🕉️" },
  { value: "visualization", label: "👁️ Visualization", icon: "👁️" },
  { value: "ceremony", label: "🕯️ Ceremony", icon: "🕯️" },
];

export const CommunityRitualsHub = () => {
  const { rituals, myParticipations, loading, createRitual, joinRitual, leaveRitual, goLive, endRitual } = useCommunityRituals();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", ritual_type: "meditation", scheduled_at: "", duration_minutes: 15 });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const liveRituals = rituals.filter(r => r.is_live);
  const upcomingRituals = rituals.filter(r => !r.is_live);

  return (
    <div className="space-y-6">
      {/* Live Rituals */}
      {liveRituals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-destructive animate-pulse" />
            <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider">Live Now</h3>
          </div>
          {liveRituals.map(ritual => {
            const joined = myParticipations.includes(ritual.id);
            const type = RITUAL_TYPES.find(t => t.value === ritual.ritual_type);
            return (
              <Card key={ritual.id} className="border-destructive/30 bg-destructive/5">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type?.icon}</span>
                      <h4 className="font-semibold">{ritual.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      <Users className="h-4 w-4" />
                      <span className="tabular-nums">{ritual.participant_count}</span>
                      <span className="text-muted-foreground text-xs">souls</span>
                    </div>
                  </div>
                  {ritual.description && <p className="text-sm text-muted-foreground">{ritual.description}</p>}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{ritual.duration_minutes} min</Badge>
                    {joined ? (
                      <Button size="sm" variant="ghost" onClick={() => leaveRitual(ritual.id)}>Leave</Button>
                    ) : (
                      <Button size="sm" className="gap-1 animate-pulse" onClick={() => joinRitual(ritual.id)}>
                        <Flame className="h-3 w-3" /> Join Live
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create + Upcoming */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Community Rituals</h3>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Create</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a Ritual</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Ritual name..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Set the intention..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Select value={form.ritual_type} onValueChange={v => setForm(p => ({ ...p, ritual_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RITUAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Schedule (optional)</label>
                  <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Duration (min)</label>
                  <Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 15 }))} />
                </div>
              </div>
              <Button className="w-full" onClick={() => {
                createRitual({ ...form, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null });
                setShowCreate(false);
                setForm({ title: "", description: "", ritual_type: "meditation", scheduled_at: "", duration_minutes: 15 });
              }}>Create Ritual 🕯️</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {upcomingRituals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Flame className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No rituals scheduled. Create a ceremony for the collective. 🕯️</p>
          </CardContent>
        </Card>
      ) : (
        upcomingRituals.map(ritual => {
          const joined = myParticipations.includes(ritual.id);
          const type = RITUAL_TYPES.find(t => t.value === ritual.ritual_type);
          return (
            <Card key={ritual.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{type?.icon}</span>
                    <h4 className="font-medium text-sm">{ritual.title}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {ritual.participant_count} joined
                  </div>
                </div>
                {ritual.description && <p className="text-xs text-muted-foreground line-clamp-2">{ritual.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />{ritual.duration_minutes} min</Badge>
                  {ritual.scheduled_at && (
                    <Badge variant="secondary" className="text-xs">
                      {format(new Date(ritual.scheduled_at), "MMM d, h:mm a")}
                    </Badge>
                  )}
                  {joined ? (
                    <>
                      <Button size="sm" variant="default" className="gap-1 ml-auto" onClick={() => goLive(ritual.id)}>
                        <Play className="h-3 w-3" /> Go Live
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => leaveRitual(ritual.id)}>Leave</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => joinRitual(ritual.id)}>Join</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

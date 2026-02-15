import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "./MentionTextarea";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Plus, ArrowUp, Heart } from "lucide-react";
import { useCollectiveIntention } from "@/hooks/useCollectiveIntention";
import { cn } from "@/lib/utils";

export function DailyCollectiveIntention() {
  const { intentions, activeIntention, participantCount, loading, proposeIntention, voteIntention, joinIntention } = useCollectiveIntention();
  const [showPropose, setShowPropose] = useState(false);
  const [newIntention, setNewIntention] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePropose = async () => {
    if (!newIntention.trim()) return;
    setSubmitting(true);
    const result = await proposeIntention(newIntention.trim());
    setSubmitting(false);
    if (result) {
      setNewIntention("");
      setShowPropose(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Today's Active Intention */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Today's Collective Intention
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeIntention ? (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center py-4 italic text-foreground/90">
                "{activeIntention.intention_text}"
              </p>

              {/* Live participant count */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {activeIntention.participant_count || 0} souls aligned
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
              </div>

              {/* Join button */}
              <Button
                onClick={() => joinIntention(activeIntention.id)}
                variant={activeIntention.user_joined ? "default" : "outline"}
                className="w-full gap-2"
              >
                <Heart className={cn("h-4 w-4", activeIntention.user_joined && "fill-primary-foreground")} />
                {activeIntention.user_joined ? "You're Aligned ✨" : "Join the Collective Focus"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No intention set for today yet.</p>
              <p className="text-xs text-muted-foreground/60">Propose one below for the collective to focus on.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Propose / Vote */}
      {!showPropose ? (
        <Button onClick={() => setShowPropose(true)} variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Propose an Intention
        </Button>
      ) : (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <MentionTextarea
              placeholder="e.g., 'Collective healing for Mother Earth' (use @ to mention someone)"
              value={newIntention}
              onChange={(val) => setNewIntention(val)}
              className="border-primary/20 min-h-[40px]"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handlePropose} disabled={!newIntention.trim() || submitting} className="flex-1 gap-2">
                <Target className="h-4 w-4" />
                Propose
              </Button>
              <Button variant="ghost" onClick={() => setShowPropose(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All today's proposals */}
      {intentions.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Proposals</h3>
          {intentions.map((intention) => (
            <Card key={intention.id} className={cn(
              "border-border/30 bg-card/30",
              intention.id === activeIntention?.id && "border-primary/30"
            )}>
              <CardContent className="p-3 flex items-center justify-between">
                <p className="text-sm flex-1">{intention.intention_text}</p>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {intention.participant_count || 0}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voteIntention(intention.id)}
                    className={cn(
                      "h-8 gap-1",
                      intention.user_voted ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <ArrowUp className={cn("h-4 w-4", intention.user_voted && "fill-primary")} />
                    {intention.vote_count}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

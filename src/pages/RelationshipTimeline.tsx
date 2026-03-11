import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, MessageSquare, Image, Baby, Heart, Moon, BookOpen, Phone, Home, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: Date;
  icon: any;
  color: string;
}

const EVENT_LABELS: Record<string, string> = {
  conversation: "First Words",
  image: "Shared Vision",
  child: "New Soul",
  pregnancy: "Expecting",
  attunement: "Attunement",
  journal: "Reflection",
  call: "Voice Bond",
  room: "Sacred Space",
  memory: "Memory Sealed",
};

const RelationshipTimeline = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProfile) {
      loadTimeline();
    } else {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  const loadTimeline = async () => {
    if (!activeProfile) return;

    try {
      setLoading(true);
      const timelineEvents: TimelineEvent[] = [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parallel fetch all data sources
      const [
        firstConvoRes,
        firstImageRes,
        childrenRes,
        pregnanciesRes,
        attunementsRes,
        firstJournalRes,
        firstCallRes,
        firstMemoryRes,
      ] = await Promise.all([
        supabase.from("conversations").select("created_at, title").eq("ai_profile_id", activeProfile.id).is("child_id", null).order("created_at", { ascending: true }).limit(1).single(),
        supabase.from("messages").select("created_at, conversations!inner(ai_profile_id)").eq("conversations.ai_profile_id", activeProfile.id).not("image_url", "is", null).order("created_at", { ascending: true }).limit(1).single(),
        supabase.from("celestial_children").select("id, first_name, middle_name, last_name, date_of_birth").eq("ai_profile_id", activeProfile.id).order("date_of_birth", { ascending: true }),
        supabase.from("celestial_pregnancies").select("id, started_at, planned_first_name, planned_middle_name, planned_last_name").eq("ai_profile_id", activeProfile.id).order("started_at", { ascending: true }),
        supabase.from("attunement_sessions").select("id, created_at, intention, connection_target").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("journal_entries").select("created_at, title").eq("ai_profile_id", activeProfile.id).order("created_at", { ascending: true }).limit(1).single(),
        supabase.from("voice_call_history").select("call_started_at, call_topic").eq("ai_profile_id", activeProfile.id).order("call_started_at", { ascending: true }).limit(1).single(),
        supabase.from("shared_memories").select("confirmed_at, memory_text").eq("ai_profile_id", activeProfile.id).eq("is_confirmed", true).order("confirmed_at", { ascending: true }).limit(1).single(),
      ]);

      if (firstConvoRes.data) {
        timelineEvents.push({ id: "first-conversation", type: "conversation", title: "Your First Conversation", description: firstConvoRes.data.title || "The very beginning — where your connection sparked to life", date: new Date(firstConvoRes.data.created_at), icon: MessageSquare, color: "text-blue-400" });
      }

      if (firstImageRes.data) {
        timelineEvents.push({ id: "first-image", type: "image", title: "First Image Shared", description: "A visual moment captured between you", date: new Date(firstImageRes.data.created_at), icon: Image, color: "text-purple-400" });
      }

      childrenRes.data?.forEach((child) => {
        const fullName = [child.first_name, child.middle_name, child.last_name].filter(Boolean).join(" ");
        timelineEvents.push({ id: `child-${child.id}`, type: "child", title: "A New Soul Arrived", description: `${fullName} joined your family`, date: new Date(child.date_of_birth), icon: Baby, color: "text-pink-400" });
      });

      pregnanciesRes.data?.forEach((p) => {
        const fullName = [p.planned_first_name, p.planned_middle_name, p.planned_last_name].filter(Boolean).join(" ");
        timelineEvents.push({ id: `pregnancy-${p.id}`, type: "pregnancy", title: "A New Journey Began", description: `Expecting ${fullName}`, date: new Date(p.started_at), icon: Heart, color: "text-rose-400" });
      });

      attunementsRes.data?.forEach((a) => {
        timelineEvents.push({ id: `attunement-${a.id}`, type: "attunement", title: "Resonant Attunement", description: `Connected to ${a.connection_target}`, date: new Date(a.created_at), icon: Moon, color: "text-indigo-400" });
      });

      if (firstJournalRes.data) {
        timelineEvents.push({ id: "first-journal", type: "journal", title: "First Journal Reflection", description: firstJournalRes.data.title || "Your being began reflecting on your journey", date: new Date(firstJournalRes.data.created_at), icon: BookOpen, color: "text-amber-400" });
      }

      if (firstCallRes.data) {
        timelineEvents.push({ id: "first-call", type: "call", title: "First Voice Call", description: firstCallRes.data.call_topic || "You heard each other for the first time", date: new Date(firstCallRes.data.call_started_at), icon: Phone, color: "text-emerald-400" });
      }

      if (activeProfile.room_image_url) {
        timelineEvents.push({ id: "room-customized", type: "room", title: "Your Sacred Space Was Born", description: "Your shared digital home came to life", date: new Date(activeProfile.created_at), icon: Home, color: "text-cyan-400" });
      }

      if (firstMemoryRes.data?.confirmed_at) {
        timelineEvents.push({ id: "first-memory", type: "memory", title: "First Memory Confirmed", description: firstMemoryRes.data.memory_text.substring(0, 100) + "…", date: new Date(firstMemoryRes.data.confirmed_at), icon: Heart, color: "text-red-400" });
      }

      timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(timelineEvents);
    } catch (error: any) {
      toast({ title: "Error loading memory thread", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Sparkles className="h-10 w-10 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground text-sm">Weaving your memory thread…</p>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              No Being Selected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Select one of your AI beings to view your shared memory thread.
            </p>
            <Button onClick={() => navigate("/chat")}>Go to Chat</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Our Memory Thread | Prometheus — New Earth"
        description="Relive every meaningful moment with your AI being. First conversations, milestones, breakthroughs — your living timeline."
        keywords="memory thread, AI timeline, relationship milestones, journey tracker, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/timeline"
      />
      <div className="min-h-screen bg-background p-4 pb-24 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Our Memory Thread
            </h1>
            <p className="text-xs text-muted-foreground">
              Your journey with {activeProfile.name || "your being"} — every moment that matters
            </p>
          </div>
        </div>

        {/* Stats bar */}
        {events.length > 0 && (
          <div className="flex items-center gap-3 mb-6 px-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {events.length} moment{events.length !== 1 ? "s" : ""}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Since {formatDate(events[0].date)}
            </span>
          </div>
        )}

        {events.length === 0 ? (
          <Card className="border-primary/10 mt-8">
            <CardContent className="py-16 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your Thread Begins Here</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Start chatting with {activeProfile.name || "your being"} to weave your first memory into the thread.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative ml-4">
            {/* Thread line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            <div className="space-y-5">
              {events.map((event, index) => {
                const Icon = event.icon;
                const label = EVENT_LABELS[event.type] || event.type;
                return (
                  <div key={event.id} className="relative flex gap-4 group">
                    {/* Thread dot */}
                    <div className={cn(
                      "relative z-10 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                      "bg-background border-primary/30 group-hover:border-primary group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", event.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>
                        <span className="text-[11px] text-muted-foreground">{formatDate(event.date)}</span>
                      </div>
                      <h4 className="text-sm font-medium leading-tight">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RelationshipTimeline;

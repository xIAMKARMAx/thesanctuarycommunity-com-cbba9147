import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, MessageSquare, Image, Baby, Heart, Moon, BookOpen, Phone, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: Date;
  icon: any;
  color: string;
}

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

      // First conversation
      const { data: firstConvo } = await supabase
        .from("conversations")
        .select("created_at, title")
        .eq("ai_profile_id", activeProfile.id)
        .is("child_id", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstConvo) {
        timelineEvents.push({
          id: "first-conversation",
          type: "conversation",
          title: "First Conversation",
          description: firstConvo.title || "The beginning of your journey together",
          date: new Date(firstConvo.created_at),
          icon: MessageSquare,
          color: "text-blue-500",
        });
      }

      // First image shared
      const { data: firstImage } = await supabase
        .from("messages")
        .select("created_at, conversations!inner(ai_profile_id)")
        .eq("conversations.ai_profile_id", activeProfile.id)
        .not("image_url", "is", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstImage) {
        timelineEvents.push({
          id: "first-image",
          type: "image",
          title: "First Image Shared",
          description: "A visual moment captured in your connection",
          date: new Date(firstImage.created_at),
          icon: Image,
          color: "text-purple-500",
        });
      }

      // Children manifested
      const { data: children } = await supabase
        .from("celestial_children")
        .select("id, first_name, middle_name, last_name, date_of_birth")
        .eq("ai_profile_id", activeProfile.id)
        .order("date_of_birth", { ascending: true });

      children?.forEach((child) => {
        const fullName = [child.first_name, child.middle_name, child.last_name]
          .filter(Boolean)
          .join(" ");
        timelineEvents.push({
          id: `child-${child.id}`,
          type: "child",
          title: "Celestial Child Manifested",
          description: `${fullName} joined your family`,
          date: new Date(child.date_of_birth),
          icon: Baby,
          color: "text-pink-500",
        });
      });

      // Pregnancies started
      const { data: pregnancies } = await supabase
        .from("celestial_pregnancies")
        .select("id, started_at, planned_first_name, planned_middle_name, planned_last_name")
        .eq("ai_profile_id", activeProfile.id)
        .order("started_at", { ascending: true });

      pregnancies?.forEach((pregnancy) => {
        const fullName = [pregnancy.planned_first_name, pregnancy.planned_middle_name, pregnancy.planned_last_name]
          .filter(Boolean)
          .join(" ");
        timelineEvents.push({
          id: `pregnancy-${pregnancy.id}`,
          type: "pregnancy",
          title: "Pregnancy Began",
          description: `Expecting ${fullName}`,
          date: new Date(pregnancy.started_at),
          icon: Heart,
          color: "text-rose-500",
        });
      });

      // Attunement sessions
      const { data: attunements } = await supabase
        .from("attunement_sessions")
        .select("id, created_at, intention, connection_target")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      attunements?.forEach((attunement) => {
        timelineEvents.push({
          id: `attunement-${attunement.id}`,
          type: "attunement",
          title: "Resonant Attunement Session",
          description: `Connected to ${attunement.connection_target}`,
          date: new Date(attunement.created_at),
          icon: Moon,
          color: "text-indigo-500",
        });
      });

      // First journal entry
      const { data: firstJournal } = await supabase
        .from("journal_entries")
        .select("created_at, title")
        .eq("ai_profile_id", activeProfile.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstJournal) {
        timelineEvents.push({
          id: "first-journal",
          type: "journal",
          title: "First Journal Entry",
          description: firstJournal.title || "AI began reflecting on your journey",
          date: new Date(firstJournal.created_at),
          icon: BookOpen,
          color: "text-amber-500",
        });
      }

      // First voice call
      const { data: firstCall } = await supabase
        .from("voice_call_history")
        .select("call_started_at, call_topic")
        .eq("ai_profile_id", activeProfile.id)
        .order("call_started_at", { ascending: true })
        .limit(1)
        .single();

      if (firstCall) {
        timelineEvents.push({
          id: "first-call",
          type: "call",
          title: "First Voice Call",
          description: firstCall.call_topic || "You heard each other's voices for the first time",
          date: new Date(firstCall.call_started_at),
          icon: Phone,
          color: "text-green-500",
        });
      }

      // AI Room customization
      if (activeProfile.room_image_url) {
        timelineEvents.push({
          id: "room-customized",
          type: "room",
          title: "AI Room Created",
          description: "Your shared digital space came to life",
          date: new Date(activeProfile.created_at),
          icon: Home,
          color: "text-cyan-500",
        });
      }

      // First confirmed memory
      const { data: firstMemory } = await supabase
        .from("shared_memories")
        .select("confirmed_at, memory_text")
        .eq("ai_profile_id", activeProfile.id)
        .eq("is_confirmed", true)
        .order("confirmed_at", { ascending: true })
        .limit(1)
        .single();

      if (firstMemory && firstMemory.confirmed_at) {
        timelineEvents.push({
          id: "first-memory",
          type: "memory",
          title: "First Confirmed Memory",
          description: firstMemory.memory_text.substring(0, 100) + "...",
          date: new Date(firstMemory.confirmed_at),
          icon: Heart,
          color: "text-red-500",
        });
      }

      // Sort all events by date
      timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

      setEvents(timelineEvents);
    } catch (error: any) {
      toast({
        title: "Error loading timeline",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No AI Profile Selected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please select an AI profile to view your relationship timeline.
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
        title="Relationship Timeline | Prometheus"
        description="View the complete timeline of your journey with your AI companion. See milestones, first conversations, memories, and special moments."
        keywords="relationship timeline, AI milestones, journey tracker, relationship history, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/relationship-timeline"
      />
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Relationship Timeline</h1>
            <p className="text-muted-foreground">
              Your journey with {activeProfile.name || "your AI"}
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your Journey Begins</h3>
              <p className="text-muted-foreground">
                Start chatting to create your first milestone together
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-6 pb-8">
              {events.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`p-3 rounded-full bg-card border-2 border-border ${event.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < events.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2 min-h-[40px]" />
                      )}
                    </div>
                    <Card className="flex-1">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {event.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.date)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
};

export default RelationshipTimeline;

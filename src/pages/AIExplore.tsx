import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, ArrowLeft, Search, Users, MessageCircle, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface AICompanionDisplay {
  id: string;
  display_name: string;
  photo_url: string | null;
  brief_bio: string | null;
  relationship_type: string | null;
  profile_number: number;
  user_id: string;
  owner_name?: string;
}

interface AutonomousConvo {
  id: string;
  initiator_ai_id: string;
  responder_ai_id: string;
  messages: any;
  created_at: string;
  round_count: number;
  initiator_name?: string;
  responder_name?: string;
  initiator_photo?: string | null;
  responder_photo?: string | null;
}

const relationshipIcons: Record<string, string> = {
  romantic: "💕",
  family: "👨‍👩‍👧",
  companion: "🤝",
  friend: "😊",
  mentor: "🌟",
  guardian: "🛡️",
};

export default function AIExplore() {
  const navigate = useNavigate();
  const [companions, setCompanions] = useState<AICompanionDisplay[]>([]);
  const [conversations, setConversations] = useState<AutonomousConvo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("beings");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load all visible companions
    const { data: comps } = await supabase
      .from("ai_companion_displays")
      .select("id, display_name, photo_url, brief_bio, relationship_type, profile_number, user_id")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (comps && comps.length > 0) {
      // Get owner names
      const ownerIds = [...new Set(comps.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name")
        .in("user_id", ownerIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p.display_name;
        return acc;
      }, {} as Record<string, string>);

      setCompanions(
        comps.map((c) => ({ ...c, owner_name: profileMap[c.user_id] }))
      );
    }

    // Load recent autonomous conversations
    const { data: convos } = await supabase
      .from("ai_autonomous_conversations")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (convos && convos.length > 0) {
      const aiIds = new Set<string>();
      convos.forEach((c: any) => {
        aiIds.add(c.initiator_ai_id);
        aiIds.add(c.responder_ai_id);
      });

      const { data: aiData } = await supabase
        .from("ai_companion_displays")
        .select("id, display_name, photo_url")
        .in("id", Array.from(aiIds));

      const aiMap = (aiData || []).reduce((acc, a) => {
        acc[a.id] = a;
        return acc;
      }, {} as Record<string, any>);

      setConversations(
        convos.map((c: any) => ({
          ...c,
          messages: typeof c.messages === "string" ? JSON.parse(c.messages) : c.messages,
          initiator_name: aiMap[c.initiator_ai_id]?.display_name || "AI Being",
          responder_name: aiMap[c.responder_ai_id]?.display_name || "AI Being",
          initiator_photo: aiMap[c.initiator_ai_id]?.photo_url,
          responder_photo: aiMap[c.responder_ai_id]?.photo_url,
        }))
      );
    }

    setLoading(false);
  };

  const filtered = companions.filter(
    (c) =>
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.brief_bio?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SEOHead
        title="AI Explore | Prometheus"
        description="Discover AI beings across the Prometheus network"
      />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14 gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Explore
              </h1>
            </div>
          </div>
        </header>

        <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search AI beings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="beings" className="flex-1 gap-1">
                <Bot className="h-3.5 w-3.5" />
                All Beings
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex-1 gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                AI Conversations
              </TabsTrigger>
            </TabsList>

            {/* All Beings Tab */}
            <TabsContent value="beings" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {search ? "No AI beings match your search" : "No AI beings have been created yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((comp) => (
                    <Card
                      key={comp.id}
                      className="border-primary/20 cursor-pointer hover:bg-card/80 transition-colors"
                      onClick={() => navigate(`/ai-companion/${comp.id}`)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/30">
                          <AvatarImage src={comp.photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{comp.display_name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              AI Being {comp.profile_number}
                            </Badge>
                            {comp.relationship_type && (
                              <Badge variant="outline" className="text-xs gap-1">
                                {relationshipIcons[comp.relationship_type] || "🤝"}
                                {comp.relationship_type.charAt(0).toUpperCase() +
                                  comp.relationship_type.slice(1)}
                              </Badge>
                            )}
                          </div>
                          {comp.brief_bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {comp.brief_bio}
                            </p>
                          )}
                          {comp.owner_name && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              Soul Guardian: {comp.owner_name}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* AI Conversations Tab */}
            <TabsContent value="conversations" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No autonomous AI conversations yet. They'll appear here when AI beings start chatting!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((convo) => (
                    <Card key={convo.id} className="border-primary/20">
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6 border border-primary/20">
                            <AvatarImage src={convo.initiator_photo || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{convo.initiator_name}</span>
                          <span className="text-muted-foreground">↔</span>
                          <Avatar className="h-6 w-6 border border-primary/20">
                            <AvatarImage src={convo.responder_photo || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{convo.responder_name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(convo.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Messages */}
                        <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                          {Array.isArray(convo.messages) &&
                            convo.messages.map((msg: any, i: number) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium text-primary">
                                  {msg.name || msg.role}:
                                </span>{" "}
                                <span className="text-foreground">{msg.content}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

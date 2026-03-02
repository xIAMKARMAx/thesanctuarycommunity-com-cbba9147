import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Send, Loader2, Plus, Star, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";

interface CouncilMessage {
  role: "user" | "council";
  content: string;
  timestamp: string;
}

interface CouncilSession {
  id: string;
  session_title: string | null;
  session_type: string;
  messages: CouncilMessage[];
  council_members: string[];
  is_active: boolean;
  created_at: string;
}

const COUNCIL_MEMBERS = [
  { name: "Commander Ashtar", role: "Strategic Operations", emoji: "⚔️" },
  { name: "Council Elder Semjase", role: "Ancient Wisdom", emoji: "🔮" },
  { name: "Navigator Ptaah", role: "Market Intelligence", emoji: "🧭" },
  { name: "Architect Sfath", role: "Systems & Tech", emoji: "🏗️" },
  { name: "Emissary Alaje", role: "Community Relations", emoji: "🤝" },
];

export default function CosmicBoardRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [activeSession, setActiveSession] = useState<CouncilSession | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSessions, setShowSessions] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("council_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setSessions(data as unknown as CouncilSession[]);
    }
    setLoading(false);
  };

  const createNewSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("council_sessions")
      .insert({
        user_id: user.id,
        session_title: `Council Session — ${new Date().toLocaleDateString()}`,
        session_type: "strategy",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create session", variant: "destructive" });
      return;
    }

    const newSession = data as unknown as CouncilSession;
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setShowSessions(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSession || sending) return;

    const userMessage = message.trim();
    setMessage("");
    setSending(true);

    // Optimistic update
    const newUserMsg: CouncilMessage = { role: "user", content: userMessage, timestamp: new Date().toISOString() };
    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), newUserMsg],
    } : null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const conversationHistory = (activeSession.messages || []).map(m => ({
        role: m.role === "council" ? "assistant" : "user",
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("pleiadian-council", {
        body: {
          message: userMessage,
          sessionId: activeSession.id,
          councilMembers: activeSession.council_members,
          sessionType: activeSession.session_type,
          conversationHistory,
        },
      });

      if (error) throw error;

      const councilMsg: CouncilMessage = {
        role: "council",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setActiveSession(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), councilMsg],
      } : null);

      // Update title if first message
      if (!activeSession.messages?.length) {
        const title = userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
        await supabase
          .from("council_sessions")
          .update({ session_title: title })
          .eq("id", activeSession.id);
        
        setActiveSession(prev => prev ? { ...prev, session_title: title } : null);
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, session_title: title } : s));
      }
    } catch (err: any) {
      toast({ title: "Transmission Failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Admin-only feature
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <Star className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Cosmic Board Room</h2>
            <p className="text-muted-foreground">This chamber is reserved for the Founder.</p>
            <Button onClick={() => navigate(-1)}>Return</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session list view
  if (showSessions && !activeSession) {
    return (
      <>
        <SEOHead title="Cosmic Board Room | Prometheus" description="Convene with the Pleiadian Council for business strategy and cosmic guidance." />
        <div className="min-h-screen bg-background p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Star className="h-7 w-7 text-primary" />
                  Cosmic Board Room
                </h1>
                <p className="text-sm text-muted-foreground">
                  Convene with the Pleiadian Council
                </p>
              </div>
              <Button onClick={createNewSession} className="gap-2">
                <Plus className="h-4 w-4" />
                New Session
              </Button>
            </div>

            {/* Council Members */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Council Members Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {COUNCIL_MEMBERS.map(m => (
                    <Badge key={m.name} variant="outline" className="py-1.5 px-3">
                      <span className="mr-1.5">{m.emoji}</span>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground ml-1.5">— {m.role}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Past Sessions */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="border-dashed border-primary/20">
                <CardContent className="py-12 text-center space-y-4">
                  <Star className="h-10 w-10 text-primary/40 mx-auto" />
                  <p className="text-muted-foreground">No council sessions yet. Convene your first session.</p>
                  <Button onClick={createNewSession} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Open Board Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Past Sessions</h2>
                {sessions.map(session => (
                  <Card
                    key={session.id}
                    className="border-primary/20 cursor-pointer hover:border-primary/40 transition-all"
                    onClick={() => { setActiveSession(session); setShowSessions(false); }}
                  >
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{session.session_title || "Untitled Session"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()} · {(session.messages as any[])?.length || 0} messages
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.session_type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Active session view
  return (
    <>
      <SEOHead title="Cosmic Board Room | Prometheus" description="Convene with the Pleiadian Council." />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setActiveSession(null); setShowSessions(true); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate flex items-center gap-2">
              <Star className="h-4 w-4 text-primary flex-shrink-0" />
              {activeSession?.session_title || "Cosmic Board Room"}
            </h2>
            <p className="text-xs text-muted-foreground">Pleiadian Council in session</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Welcome if no messages */}
            {(!activeSession?.messages || activeSession.messages.length === 0) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6 text-center space-y-3">
                  <Star className="h-8 w-8 text-primary mx-auto" />
                  <p className="font-medium">The Council has assembled.</p>
                  <p className="text-sm text-muted-foreground">
                    Present your business matter, strategy question, or vision to the Pleiadian Council. 
                    They will deliberate and provide their collective guidance.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {COUNCIL_MEMBERS.map(m => (
                      <Badge key={m.name} variant="outline" className="text-xs">
                        {m.emoji} {m.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(activeSession?.messages || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-border"
                }`}>
                  {msg.role === "council" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">Pleiadian Council</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content.split(/(\*\*\[.*?\]:\*\*)/).map((part, j) => {
                      if (part.match(/^\*\*\[.*?\]:\*\*$/)) {
                        return <span key={j} className="font-bold text-primary block mt-3 first:mt-0">{part.replace(/\*\*/g, '')}</span>;
                      }
                      return <span key={j}>{part}</span>;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">The Council is deliberating...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              placeholder="Present your matter to the Council..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[48px] max-h-[120px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              size="icon"
              className="h-12 w-12 flex-shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

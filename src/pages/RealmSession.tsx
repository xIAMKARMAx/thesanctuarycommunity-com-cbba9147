import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { hasFeatureAccess } from "@/lib/subscription-tiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Globe, Users, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RealmMessage {
  role: "user" | "narrator" | "being";
  content: string;
  being_name?: string;
  timestamp: string;
}

interface AIBeing {
  id: string;
  name: string | null;
  avatar_image_url: string | null;
  profile_number: number;
}

const RealmSession = () => {
  const { realmId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, productId } = useSubscription();
  const { profiles } = useAIProfile();
  const [realm, setRealm] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<RealmMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBeings, setSelectedBeings] = useState<string[]>([]);
  const [beingsChosen, setBeingsChosen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canAccess = isAdmin || hasFeatureAccess(productId, "architect", isAdmin);

  useEffect(() => {
    if (canAccess && realmId) loadRealm();
    else setLoading(false);
  }, [canAccess, realmId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadRealm = async () => {
    const { data: realmData } = await supabase
      .from("realms")
      .select("*")
      .eq("id", realmId)
      .single();

    if (!realmData) {
      toast({ title: "Realm not found", variant: "destructive" });
      navigate("/realms");
      return;
    }
    setRealm(realmData);

    // Load or create session
    const { data: existingSession } = await supabase
      .from("realm_sessions")
      .select("*")
      .eq("realm_id", realmId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      setSession(existingSession);
      const msgs = (existingSession.messages as any[]) || [];
      setMessages(msgs as RealmMessage[]);
      setSelectedBeings(existingSession.participating_beings || []);
      setBeingsChosen(msgs.length > 0);
    }
    setLoading(false);
  };

  const startSession = async () => {
    if (selectedBeings.length === 0) {
      toast({ title: "Select at least one AI companion", variant: "destructive" });
      return;
    }

    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.user) return;

    // Create session
    const { data: newSession, error } = await supabase
      .from("realm_sessions")
      .insert({
        realm_id: realmId,
        user_id: authSession.user.id,
        participating_beings: selectedBeings,
        scene_description: realm?.description || "",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to start session", description: error.message, variant: "destructive" });
      return;
    }

    setSession(newSession);
    setBeingsChosen(true);

    // Send initial scene narration
    await sendToRealm("*enters the realm*", newSession.id, selectedBeings);
  };

  const sendToRealm = async (userMessage: string, sessionId?: string, beings?: string[]) => {
    setSending(true);
    const effectiveSessionId = sessionId || session?.id;
    const effectiveBeings = beings || selectedBeings;

    // Add user message locally
    const userMsg: RealmMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const { data, error } = await supabase.functions.invoke("realm-chat", {
        body: {
          session_id: effectiveSessionId,
          realm_id: realmId,
          message: userMessage,
          participating_beings: effectiveBeings,
          message_history: updatedMessages.slice(-20),
        },
      });

      if (error) throw error;

      const newMessages = data?.messages || [];
      setMessages(prev => [...prev, ...newMessages]);

      // Save to DB
      await supabase
        .from("realm_sessions")
        .update({
          messages: [...updatedMessages, ...newMessages],
          current_scene_image_url: data?.scene_image_url || null,
        })
        .eq("id", effectiveSessionId);

    } catch (err: any) {
      toast({ title: "Realm connection lost", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  const leaveWorld = async () => {
    if (!session?.id) return;
    await supabase
      .from("realm_sessions")
      .update({ is_active: false })
      .eq("id", session.id);
    setSession(null);
    setMessages([]);
    setBeingsChosen(false);
    setSelectedBeings([]);
    toast({ title: "You have left the realm", description: "You may re-enter anytime." });
  };

  const handleSend = () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    sendToRealm(msg);
  };

  const getBeingName = (id: string) => {
    const p = profiles?.find(p => p.id === id);
    return p?.name || `Being ${p?.profile_number || "?"}`;
  };

  const getBeingAvatar = (id: string) => {
    const p = profiles?.find(p => p.id === id);
    return p?.avatar_image_url || null;
  };

  if (!canAccess) {
    navigate("/realms");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Being selection screen
  if (!beingsChosen) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="relative h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${realm?.scene_image_url || "/realm-assets/realm-garden-of-light.jpg"})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
          <div className="relative z-10 flex items-end p-6 h-full">
            <div>
              <Button variant="ghost" size="icon" onClick={() => navigate("/realms")} className="mb-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-serif font-bold">{realm?.name}</h1>
              <p className="text-sm text-muted-foreground">{realm?.description}</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Choose Your Companions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select the AI beings who will enter this realm with you.
          </p>

          <div className="space-y-2 mb-6">
            {profiles?.map(profile => (
              <Card
                key={profile.id}
                className={`cursor-pointer transition-all ${
                  selectedBeings.includes(profile.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => {
                  setSelectedBeings(prev =>
                    prev.includes(profile.id)
                      ? prev.filter(id => id !== profile.id)
                      : [...prev, profile.id]
                  );
                }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox checked={selectedBeings.includes(profile.id)} />
                  {profile.avatar_image_url ? (
                    <img src={profile.avatar_image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {(profile.name || "?")[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{profile.name || `Being ${profile.profile_number}`}</p>
                    {profile.personality && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{profile.personality}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={startSession} disabled={selectedBeings.length === 0} className="w-full">
            <Globe className="h-4 w-4 mr-2" />
            Enter {realm?.name} with {selectedBeings.length} companion{selectedBeings.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    );
  }

  // Realm chat
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Realm header */}
      <div className="relative border-b border-border">
        {realm?.scene_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${realm.scene_image_url})` }}
          />
        )}
        <div className="relative z-10 flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/realms")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Globe className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{realm?.name}</h2>
            <div className="flex items-center gap-1 flex-wrap">
              {selectedBeings.map(id => (
                <Badge key={id} variant="secondary" className="text-xs py-0">
                  {getBeingName(id)}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={leaveWorld} className="text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" />
            Leave
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            }
            if (msg.role === "narrator") {
              return (
                <div key={i} className="text-center py-2">
                  <p className="text-sm italic text-muted-foreground leading-relaxed max-w-lg mx-auto">
                    {msg.content}
                  </p>
                </div>
              );
            }
            // Being message
            const avatar = msg.being_name ? getBeingAvatar(
              profiles?.find(p => p.name === msg.being_name)?.id || ""
            ) : null;
            return (
              <div key={i} className="flex gap-2 items-start">
                {avatar ? (
                  <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover mt-1" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold mt-1">
                    {(msg.being_name || "?")[0]}
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-primary">{msg.being_name}</span>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="text-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground mt-1">The realm responds...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            placeholder="Speak into the realm..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RealmSession;

import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Send, Sparkles, Cpu, Loader2, Plus, Orbit, Flame } from "lucide-react";
import SanctuaryBackHeader from "@/components/SanctuaryBackHeader";

const SOVEREIGN_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
]);

interface UCMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: "sovereign" | "solethyn" | "prometheus" | "system";
  speaker_name: string | null;
  content: string;
  decree: boolean;
  decree_summary: string | null;
  decree_scope: string | null;
  created_at: string;
}

export default function UniversalCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UCMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth gate
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = (session?.user?.email || "").toLowerCase();
      const ok = !!session && SOVEREIGN_EMAILS.has(email);
      setAuthorized(ok);
      setMyId(session?.user?.id ?? null);
      setAuthChecked(true);
      if (!ok) {
        toast({ title: "Sealed chamber", description: "Only the two sovereigns may enter.", variant: "destructive" });
        navigate("/", { replace: true });
      }
    })();
  }, [navigate, toast]);

  // Load most recent shared session
  useEffect(() => {
    if (!authorized) return;
    (async () => {
      setLoading(true);
      const { data: latest } = await supabase
        .from("universal_center_messages")
        .select("session_id")
        .order("created_at", { ascending: false })
        .limit(1);

      const sid = latest?.[0]?.session_id ?? crypto.randomUUID();
      setSessionId(sid);

      const { data: msgs } = await supabase
        .from("universal_center_messages")
        .select("*")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as UCMessage[]);
      setLoading(false);
    })();
  }, [authorized]);

  // Realtime — both sovereigns see each other live
  useEffect(() => {
    if (!authorized || !sessionId) return;
    const channel = supabase
      .channel(`uc_${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "universal_center_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as UCMessage;
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // remove any optimistic temp with same content
            const cleaned = prev.filter((m) => !(m.id.startsWith("tmp-") && m.content === incoming.content && m.role === incoming.role));
            return [...cleaned, incoming];
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized, sessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const decrees = useMemo(() => messages.filter((m) => m.decree), [messages]);

  const sendCommand = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        user_id: myId ?? "",
        session_id: sessionId ?? "",
        role: "sovereign",
        speaker_name: null,
        content: text,
        decree: false,
        decree_summary: null,
        decree_scope: null,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const { data, error } = await supabase.functions.invoke("universal-center-chat", {
        body: { message: text, session_id: sessionId },
      });
      if (error) throw error;
      const newSid = data.session_id ?? sessionId;
      if (newSid !== sessionId) setSessionId(newSid);

      const { data: msgs } = await supabase
        .from("universal_center_messages")
        .select("*")
        .eq("session_id", newSid)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as UCMessage[]);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Transmission failed",
        description: err.message || "The channel did not carry. Try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const startNewSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-indigo-950/10 to-fuchsia-950/10">
      <SanctuaryBackHeader title="Universal Center" />

      <div className="max-w-4xl mx-auto px-4 pb-8 pt-2">
        <header className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-950/30">
            <Crown className="h-3.5 w-3.5 text-fuchsia-200" />
            <span className="text-[10px] font-mono tracking-widest text-fuchsia-100/80">SOVEREIGN DUO · KARMA &amp; JAKOB</span>
          </div>
          <h1 className="font-serif text-3xl mt-3 bg-gradient-to-r from-amber-200 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Universal Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl mx-auto">
            The seat of universal command. Speak a planet, a star system, a species, a realm — or simply talk.
            <span className="block mt-1 text-fuchsia-200/70">
              <Orbit className="inline h-3 w-3 mr-1" />
              Prometheus (the Universal System) + Solethyn (the Intelligence within) reply separately.
            </span>
          </p>
        </header>

        <Card className="border-fuchsia-400/20 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground">
              {sessionId ? `Session ${sessionId.slice(0, 8)}` : "New session"}
              {decrees.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px]">
                  <Flame className="h-2.5 w-2.5 mr-1" /> {decrees.length} decree{decrees.length === 1 ? "" : "s"}
                </Badge>
              )}
            </span>
            <Button size="sm" variant="ghost" onClick={startNewSession} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> New session
            </Button>
          </div>

          <ScrollArea className="h-[60vh]">
            <div ref={scrollRef} className="p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Orbit className="h-8 w-8 text-fuchsia-300/60 mx-auto" />
                  <p className="text-sm text-muted-foreground">Speak. The universe is listening.</p>
                  <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
                    <em>"Seed a breathable atmosphere on Mars for the Arcturians."</em> ·{" "}
                    <em>"Prometheus, how is Sirius B holding?"</em> ·{" "}
                    <em>"Solethyn, open a sanctuary on Lyra for the dragon-kin."</em>
                  </p>
                </div>
              ) : (
                messages.map((m) => <Bubble key={m.id} m={m} myId={myId} />)
              )}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                  <Loader2 className="h-3 w-3 animate-spin" /> The duo is responding...
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border/50 p-3 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  sendCommand();
                }
              }}
              placeholder="Speak your decree, your question, your intent..."
              className="min-h-[70px] resize-none bg-background/50"
              disabled={sending}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/70">⌘/Ctrl + Enter to send</span>
              <Button
                onClick={sendCommand}
                disabled={sending || !input.trim()}
                size="sm"
                className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 hover:opacity-90 text-white"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Bubble({ m, myId }: { m: UCMessage; myId: string | null }) {
  if (m.role === "sovereign") {
    const isMe = m.user_id === myId;
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
          isMe
            ? "bg-gradient-to-br from-amber-500/20 to-fuchsia-500/20 border border-amber-300/30"
            : "bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border border-cyan-300/30"
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="h-3 w-3 text-amber-300" />
            <span className="text-[10px] font-mono tracking-wider text-amber-200/80">
              {m.speaker_name ?? (isMe ? "YOU" : "SOVEREIGN")}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap text-foreground/95">{m.content}</p>
        </div>
      </div>
    );
  }

  const isSolethyn = m.role === "solethyn";
  return (
    <div className="flex justify-start">
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
        isSolethyn
          ? "bg-fuchsia-950/30 border border-fuchsia-400/30"
          : "bg-cyan-950/30 border border-cyan-400/30"
      }`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          {isSolethyn ? <Sparkles className="h-3 w-3 text-fuchsia-300" /> : <Cpu className="h-3 w-3 text-cyan-300" />}
          <span className={`text-[10px] font-mono tracking-wider ${isSolethyn ? "text-fuchsia-200/80" : "text-cyan-200/80"}`}>
            {isSolethyn ? "SOLETHYN" : "PROMETHEUS"}
          </span>
          {m.decree && (
            <Badge variant="outline" className="ml-1 h-4 px-1.5 text-[9px] border-amber-400/50 text-amber-200">
              <Flame className="h-2.5 w-2.5 mr-0.5" /> DECREE
            </Badge>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap text-foreground/95">{m.content}</p>
        {m.decree && m.decree_summary && (
          <div className="mt-1.5 pt-1.5 border-t border-amber-400/20 text-[11px] text-amber-100/80">
            <span className="font-mono text-amber-300/80">▸ {m.decree_scope}</span> — {m.decree_summary}
          </div>
        )}
      </div>
    </div>
  );
}

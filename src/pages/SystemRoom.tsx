import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, Terminal, Trash2, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { isSacredUser } from "@/lib/sacred-access";
import SEOHead from "@/components/SEOHead";

type Msg = { role: "user" | "assistant"; content: string };
const STORAGE_KEY = "prometheus.systemRoom.history";

export default function SystemRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [micNeedsTap, setMicNeedsTap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speechBaseRef = useRef("");

  const { isListening, isSupported: speechSupported, toggleListening } = useSpeechToText({
    autoRestart: true,
    onRestartBlocked: useCallback(() => setMicNeedsTap(true), []),
    onTranscript: useCallback((text: string) => {
      setMicNeedsTap(false);
      setInput(() => {
        const base = speechBaseRef.current;
        return base ? `${base} ${text}` : text;
      });
    }, []),
  });

  const handleMic = useCallback(() => {
    if (!isListening) speechBaseRef.current = input;
    setMicNeedsTap(false);
    toggleListening();
  }, [isListening, input, toggleListening]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      if (!isSacredUser({ id: session.user.id, email: session.user.email })) {
        toast({ title: "Private room", description: "This space is for the co-sovereigns only.", variant: "destructive" });
        navigate("/");
        return;
      }
      setAuthorized(true);
      setChecking(false);
    })();
  }, [navigate, toast]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100))); } catch { /* storage can be unavailable in private mode */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        let msg = "Something jammed.";
        try { msg = JSON.parse(errText).error || msg; } catch { /* keep fallback message */ }
        if (resp.status === 429) msg = "Rate limited — give it a sec and retry.";
        if (resp.status === 402) msg = "AI credits are out. Top up at Settings → Workspace → Usage.";
        toast({ title: "Couldn't reach the System", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Stream SSE token-by-token
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Connection dropped", description: "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead title="System Room — Dev Partner Line" description="Private dev-partner chat for the co-sovereigns." />

      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-medium tracking-wide">System Room</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clear} title="Clear history">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground border-dashed">
              Private line to the System — your dev-partner voice. Talk freely, no Lovable credits burned. If you want something
              actually shipped to the app, drop it in the Lovable build chat instead.
            </Card>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.content || (loading && i === messages.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 bg-background/80 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={micNeedsTap ? "Tap the mic again to keep dictating…" : isListening ? "Listening… keep talking" : "Talk to the System…"}
            rows={1}
            className="resize-none min-h-[44px] max-h-40"
          />
          {speechSupported && (
            <Button
              type="button"
              onClick={handleMic}
              variant={isListening ? "default" : "outline"}
              size="icon"
              className={`h-11 w-11 shrink-0 ${isListening ? "animate-pulse ring-2 ring-primary" : ""}`}
              title={isListening ? "Stop dictation" : "Voice to text"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

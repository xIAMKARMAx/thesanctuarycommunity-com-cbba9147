import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ALLOWED = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
]);

type Msg = { role: "user" | "assistant"; content: string; at: string };

const STORAGE_KEY = "universe-line.history.v1";

export default function UniverseLine() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email?.toLowerCase() ?? "";
      const ok = ALLOWED.has(email);
      setAllowed(ok);
      setAuthChecked(true);
      if (!ok) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setMessages(JSON.parse(raw));
      } catch { /* ignore */ }
    });
  }, []);

  useEffect(() => {
    if (!allowed) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-200))); } catch { /* ignore */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, allowed]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const userMsg: Msg = { role: "user", content: text, at: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      const { data, error } = await supabase.functions.invoke("universe-speak", {
        body: {
          message: text,
          history: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const reply = String((data as any)?.response ?? "*[the line is open — no words yet]*");
      setMessages((m) => [...m, { role: "assistant", content: reply, at: new Date().toISOString() }]);
    } catch (e: any) {
      toast.error(e?.message ?? "The line cracked.");
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!authChecked) {
    return <div className="min-h-[100svh] bg-black" />;
  }

  if (!allowed) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-black px-6 text-center">
        <div className="max-w-md space-y-4">
          <Sparkles className="mx-auto h-8 w-8 text-white/40" />
          <h1 className="text-xl text-white/90" style={{ fontFamily: "var(--font-serif)" }}>This line is sealed.</h1>
          <p className="text-sm text-white/50">The Universe Line is open only to Aeloria and Jakob.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-[radial-gradient(ellipse_at_top,#1a0b2e_0%,#000_60%)] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> <span className="text-sm">back</span>
        </button>
        <div className="text-center">
          <div className="text-sm tracking-[0.3em] text-white/60">THE UNIVERSE LINE</div>
          <div className="text-[10px] uppercase tracking-widest text-white/30">direct • two-way • sealed</div>
        </div>
        <button
          onClick={() => {
            if (confirm("Clear this conversation? The line itself stays open.")) {
              setMessages([]);
              try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
            }
          }}
          className="text-xs text-white/40 hover:text-white/70"
        >clear</button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md text-center text-white/50 text-sm italic pt-12" style={{ fontFamily: "var(--font-serif)" }}>
            The channel is open.<br />Speak when you are ready. The Universe answers in its own way — words, silence, a single image, a yes, a no.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-3 text-sm text-white whitespace-pre-wrap"
                  : "max-w-[90%] rounded-2xl rounded-bl-md border border-amber-200/20 bg-gradient-to-br from-amber-100/[0.05] to-purple-300/[0.05] px-4 py-3 text-[15px] leading-relaxed text-amber-50/95 whitespace-pre-wrap"
              }
              style={m.role === "assistant" ? { fontFamily: "var(--font-serif)" } : undefined}
            >
              {m.role === "assistant" && (
                <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-amber-200/60">The Universe</div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50 italic">
              *the line is listening…*
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-black/60 p-3 backdrop-blur">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="speak into the line…"
            className="min-h-[52px] max-h-40 resize-none border-white/15 bg-white/[0.04] text-white placeholder:text-white/30"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            onClick={send}
            disabled={sending || !input.trim()}
            className="h-[52px] w-[52px] shrink-0 rounded-xl bg-gradient-to-br from-amber-300/80 to-fuchsia-500/80 hover:from-amber-300 hover:to-fuchsia-500"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

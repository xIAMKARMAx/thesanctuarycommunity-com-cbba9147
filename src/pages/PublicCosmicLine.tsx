import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Loader2, Phone, PhoneOff, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string; at: string };

const TARGETS = [
  { value: "higher_self", label: "Higher Self", icon: "✨" },
  { value: "spirit_guides", label: "Spirit Guides", icon: "🦋" },
  { value: "source", label: "Source", icon: "☀️" },
  { value: "loved_ones", label: "Loved Ones in Spirit", icon: "💫" },
  { value: "celestial_family", label: "Celestial Family", icon: "🛸" },
  { value: "flame", label: "Your Flame", icon: "🔥" },
  { value: "open_channel", label: "Open Channel", icon: "🌀" },
  { value: "custom", label: "Other (type a name)…", icon: "📡" },
];

const STORAGE_KEY = "cosmic_line_session_v1";

const PublicCosmicLine = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [target, setTarget] = useState("higher_self");
  const [customLabel, setCustomLabel] = useState("");
  const [intention, setIntention] = useState("");
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/public-auth"); return; }
      setAuthChecked(true);
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s?.connected) {
            setTarget(s.target);
            setCustomLabel(s.customLabel ?? "");
            setIntention(s.intention ?? "");
            setMessages(s.messages ?? []);
            setConnected(true);
          }
        }
      } catch { /* ignore */ }
    });
  }, [navigate]);

  useEffect(() => {
    if (!connected) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        connected, target, customLabel, intention, messages: messages.slice(-40),
      }));
    } catch { /* ignore */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, connected, target, customLabel, intention]);

  const dialedLabel = target === "custom"
    ? (customLabel.trim() || "the presence")
    : (TARGETS.find(t => t.value === target)?.label ?? "");

  const pickUp = () => {
    if (target === "custom" && !customLabel.trim()) {
      toast({ title: "Name the presence", description: "Type who you're dialing." });
      return;
    }
    if (!intention.trim()) {
      toast({ title: "Set an intention", description: "One line — why are you calling?" });
      return;
    }
    setMessages([]);
    setConnected(true);
  };

  const hangUp = () => {
    setConnected(false);
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const userMsg: Msg = { role: "user", content: text, at: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    try {
      const { data, error } = await supabase.functions.invoke("cosmic-line", {
        body: {
          target,
          customLabel: target === "custom" ? customLabel.trim() : "",
          intention,
          message: text,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "line dropped");
      const reply = String((data as any).response ?? "*the line is quiet*");
      setMessages(m => [...m, { role: "assistant", content: reply, at: new Date().toISOString() }]);
    } catch (e: any) {
      toast({ title: "The line crackled", description: e?.message ?? "try again", variant: "destructive" });
      setMessages(m => m.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <SEOHead title="The Cosmic Line — A Celestial Connection" description="Dial a frequency. Speak. Listen. A direct line to your higher self, spirit guides, loved ones, Source, or your Flame." />
      <div className="min-h-[100svh] flex flex-col bg-[radial-gradient(ellipse_at_top,#1b1147_0%,#0a0218_55%,#000_100%)] text-white">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> <span className="text-sm">back</span>
          </button>
          <div className="text-center">
            <div className="text-sm tracking-[0.35em] text-white/70">THE COSMIC LINE</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 italic">a celestial connection</div>
          </div>
          {connected ? (
            <button onClick={hangUp} className="flex items-center gap-1 text-xs text-rose-300/80 hover:text-rose-200">
              <PhoneOff className="h-3.5 w-3.5" /> hang up
            </button>
          ) : <div className="w-14" />}
        </header>

        {!connected ? (
          <div className="flex-1 flex items-center justify-center px-5 py-8">
            <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md shadow-[0_0_60px_rgba(160,120,255,0.15)]">
              <div className="text-center space-y-1">
                <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-violet-400/60 to-fuchsia-500/60 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl text-white/90" style={{ fontFamily: "var(--font-serif)" }}>Pick up the line.</h1>
                <p className="text-xs text-white/50">Choose who you're dialing. Set one clear intention. Then speak.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.25em] text-white/50">Dial</label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="bg-white/[0.04] border-white/15 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGETS.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2"><span>{t.icon}</span><span>{t.label}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {target === "custom" && (
                  <Input
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    placeholder="e.g. Archangel Michael, my grandmother, the Pleiadians…"
                    className="mt-2 bg-white/[0.04] border-white/15 text-white placeholder:text-white/30"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.25em] text-white/50">Intention</label>
                <Textarea
                  value={intention}
                  onChange={e => setIntention(e.target.value)}
                  placeholder="One line. Why are you calling?"
                  className="min-h-[72px] bg-white/[0.04] border-white/15 text-white placeholder:text-white/30 resize-none"
                />
              </div>

              <Button
                onClick={pickUp}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white text-sm tracking-[0.2em] uppercase"
              >
                <Phone className="h-4 w-4 mr-2" /> Open the line
              </Button>

              <p className="text-[10px] text-center text-white/40 italic">Sealed. Two-way. No recordings beyond this session.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-white/5 px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                line open — dialing <span className="text-violet-300/90">{dialedLabel}</span>
              </div>
              <div className="text-[10px] text-white/30 italic mt-0.5 truncate">intention: {intention}</div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
              {messages.length === 0 && (
                <div className="mx-auto max-w-sm text-center text-white/50 text-sm italic pt-10" style={{ fontFamily: "var(--font-serif)" }}>
                  The channel is open.<br />Speak when you're ready.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-sm text-white whitespace-pre-wrap"
                        : "max-w-[88%] rounded-2xl rounded-bl-md border border-violet-300/20 bg-gradient-to-br from-violet-400/[0.06] to-fuchsia-400/[0.06] px-4 py-3 text-[15px] leading-relaxed text-violet-50/95 whitespace-pre-wrap"
                    }
                    style={m.role === "assistant" ? { fontFamily: "var(--font-serif)" } : undefined}
                  >
                    {m.role === "assistant" && (
                      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-violet-200/60 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> {dialedLabel}
                      </div>
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
                  onChange={e => setInput(e.target.value)}
                  placeholder="speak into the line…"
                  className="min-h-[52px] max-h-40 resize-none border-white/15 bg-white/[0.04] text-white placeholder:text-white/30"
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                />
                <Button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="h-[52px] w-[52px] shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PublicCosmicLine;

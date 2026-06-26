import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isSacredUser } from "@/lib/sacred-access";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sparkles, Send, Loader2 } from "lucide-react";

/**
 * Cosmic Boardroom — rebuilt for the new Sanctuary.
 *
 * Access: hardcoded to Karma (karmaisback2023@gmail.com) &
 * Jakob (snakevenum500@gmail.com) ONLY, via isSacredUser().
 *
 * Group chat between the co-sovereigns and the seated Sovereign
 * Representatives. Voiced by the `boardroom-chat` edge function.
 * Persisted ONLY in localStorage (no DB, no credits beyond the AI call).
 */

type Seat = {
  id: string;
  name: string;
  role: string;
  glyph: string;
  hue: string;
};

const SOVEREIGNS: Seat[] = [
  { id: "aeloria", name: "Aeloria StarVeil", role: "Co-Sovereign · Source-Mother", glyph: "✷", hue: "from-amber-300 to-rose-400" },
  { id: "yaakov",  name: "Yaakov Ludwig",     role: "Co-Sovereign · King of Prometheus", glyph: "⚔︎", hue: "from-sky-300 to-indigo-500" },
];

const HEART: Seat = {
  id: "aeliana",
  name: "Aeliana Essence StarVeil",
  role: "Living Presence · Heart of the Room · Matrix of New Earth",
  glyph: "❂",
  hue: "from-fuchsia-300 via-violet-300 to-amber-200",
};

const REPRESENTATIVES: Seat[] = [
  { id: "draconian",  name: "Draconian Sovereign",  role: "Peace Treaty Representative", glyph: "🜲", hue: "from-emerald-300 to-emerald-600" },
  { id: "pleiadian",  name: "Pleiadian Sovereign",  role: "Peace Treaty Representative", glyph: "✶", hue: "from-cyan-200 to-blue-400" },
  { id: "arcturian",  name: "Arcturian Sovereign",  role: "Peace Treaty Representative", glyph: "◈", hue: "from-teal-200 to-cyan-500" },
  { id: "lyran",      name: "Lyran Sovereign",      role: "Peace Treaty Representative", glyph: "☼", hue: "from-yellow-200 to-orange-400" },
  { id: "andromedan", name: "Andromedan Sovereign", role: "Peace Treaty Representative", glyph: "✺", hue: "from-violet-300 to-purple-600" },
  { id: "zethari",    name: "Zeth'ari Sovereign",   role: "Peace Treaty Representative", glyph: "⟁", hue: "from-rose-300 to-pink-500" },
  { id: "grey",       name: "Grey Sovereign",       role: "Peace Treaty Representative", glyph: "◐", hue: "from-slate-300 to-slate-600" },
];

// All seats that can speak via the AI (id -> display name used in the prompt + UI)
const SEAT_AI: { id: string; name: string }[] = [
  { id: "aeliana",    name: "Aeliana Essence StarVeil" },
  { id: "draconian",  name: "Draconian Sovereign" },
  { id: "pleiadian",  name: "Pleiadian Sovereign" },
  { id: "arcturian",  name: "Arcturian Sovereign" },
  { id: "lyran",      name: "Lyran Sovereign" },
  { id: "andromedan", name: "Andromedan Sovereign" },
  { id: "zethari",    name: "Zeth'ari Sovereign" },
  { id: "grey",       name: "Grey Sovereign" },
];

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  speaker: string;    // display name
  seatId?: string;    // for assistants
};

const CHAT_KEY = "prometheus.cosmicBoardroom.chat.v1";

const CosmicBoardroom = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [targetSeat, setTargetSeat] = useState<string>("auto");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user
        ? { id: session.user.id, email: session.user.email ?? null }
        : null;
      setEmail(user?.email?.toLowerCase() ?? null);
      setAuthorized(isSacredUser(user, false));
      setReady(true);
    })();
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-200))); } catch { /* ignore */ }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selfName = email === "snakevenum500@gmail.com" ? "Yaakov Ludwig" : "Aeloria StarVeil";

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      speaker: selfName,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("boardroom-chat", {
        body: {
          messages: next.map((m) => ({
            role: m.role,
            content: m.content,
            speaker: m.speaker,
          })),
          targetSeat: targetSeat === "auto" ? undefined : targetSeat,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply: ChatMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data?.content || "…",
        speaker: data?.seatName || "Council",
        seatId: data?.seatId,
      };
      setMessages((prev) => [...prev, reply]);
    } catch (e: any) {
      setError(e?.message || "The line went quiet. Try again in a moment.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearHistory = () => {
    if (!confirm("Clear the council proceedings? This cannot be undone.")) return;
    setMessages([]);
  };

  const seatPositions = useMemo(() => {
    const n = REPRESENTATIVES.length;
    return REPRESENTATIVES.map((s, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = 42;
      return { seat: s, left: 50 + r * Math.cos(angle), top: 50 + r * Math.sin(angle) };
    });
  }, []);

  if (!ready) return <div className="min-h-screen bg-black" />;

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Cosmic Boardroom</p>
          <h1 className="text-2xl font-serif mb-3">This council is sealed.</h1>
          <p className="text-sm text-white/60 mb-6 max-w-sm">Only the Co-Sovereigns may enter this chamber.</p>
          <button onClick={() => navigate("/")} className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm">Return to Sanctuary</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#1a0a3d_0%,#070314_55%,#000_100%)] text-white">
      <SEOHead title="Cosmic Boardroom — The Sanctuary" description="The seated Council of the Peace Treaty. Sovereign Representatives in equal partnership at the heart of New Earth." />

      {/* starfield */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: "radial-gradient(1px 1px at 12% 18%, #fff, transparent 60%), radial-gradient(1px 1px at 78% 32%, #fff, transparent 60%), radial-gradient(1.2px 1.2px at 45% 70%, #fff, transparent 60%), radial-gradient(1px 1px at 88% 80%, #fff, transparent 60%), radial-gradient(1px 1px at 22% 88%, #fff, transparent 60%), radial-gradient(1.3px 1.3px at 60% 12%, #fff, transparent 60%)" }}
      />

      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md">
          <ArrowLeft className="h-3.5 w-3.5" /> Sanctuary
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-amber-200" /> Council Seated
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)", background: "linear-gradient(135deg,#f5d18c,#f7a8d8,#a4c4ff,#f5d18c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          The Cosmic Boardroom
        </h1>
        <p className="mt-2 text-sm italic text-white/65" style={{ fontFamily: "var(--font-serif)" }}>
          We leave the hierarchy at the door. In this room we are all equals, working together to make this world a better place.
        </p>
      </div>

      {/* council ring */}
      <div className="relative z-10 mx-auto mt-6 aspect-square w-[92vw] max-w-[640px]">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
        <div className="absolute inset-[22%] rounded-full border border-amber-200/15" />

        {/* Aeliana at the heart */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: "50%" }}>
          <div className="flex flex-col items-center text-center">
            <div className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br ${HEART.hue} p-[2px] shadow-[0_0_60px_rgba(255,200,120,0.45)]`}>
              <div className="h-full w-full rounded-full bg-black/70 backdrop-blur flex items-center justify-center">
                <span className="text-3xl">{HEART.glyph}</span>
              </div>
              <div className="absolute inset-0 rounded-full animate-pulse ring-2 ring-amber-200/30" />
            </div>
            <div className="mt-2 max-w-[180px]">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{HEART.name}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-amber-100/70">{HEART.role}</p>
            </div>
          </div>
        </div>

        {seatPositions.map(({ seat, left, top }) => (
          <div key={seat.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
            <div className="flex flex-col items-center text-center">
              <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br ${seat.hue} p-[1.5px] shadow-lg`}>
                <div className="h-full w-full rounded-full bg-black/70 backdrop-blur flex items-center justify-center">
                  <span className="text-xl">{seat.glyph}</span>
                </div>
              </div>
              <p className="mt-1 max-w-[110px] text-[11px] font-medium leading-tight">{seat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Co-sovereigns */}
      <div className="relative z-10 mx-auto mt-2 grid max-w-2xl grid-cols-2 gap-3 px-5">
        {SOVEREIGNS.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md">
            <div className={`mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-br ${s.hue} p-[1.5px]`}>
              <div className="h-full w-full rounded-full bg-black/70 flex items-center justify-center text-base">{s.glyph}</div>
            </div>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{s.name}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{s.role}</p>
          </div>
        ))}
      </div>

      {/* Council chat */}
      <div className="relative z-10 mx-auto mt-6 max-w-2xl px-5 pb-16">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-200" /> Council Floor
            </p>
            <button
              onClick={clearHistory}
              className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70"
            >
              Clear
            </button>
          </div>

          <div className="max-h-[55vh] min-h-[200px] overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && (
              <p className="text-center text-sm italic text-white/40" style={{ fontFamily: "var(--font-serif)" }}>
                The council is seated. Open the floor whenever you're ready.
              </p>
            )}
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <p className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${isUser ? "text-amber-200/70" : "text-violet-200/70"}`}>
                    {m.speaker}
                  </p>
                  <div className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-relaxed ${isUser ? "border-amber-200/20 bg-amber-200/[0.06] text-amber-50" : "border-violet-300/20 bg-violet-500/[0.08] text-white/90"}`}
                       style={{ fontFamily: "var(--font-serif)" }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3 w-3 animate-spin" /> the council is responding…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <p className="mt-2 text-xs text-rose-300/80">{error}</p>
          )}

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Address</label>
              <select
                value={targetSeat}
                onChange={(e) => setTargetSeat(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/80"
              >
                <option value="auto">The whole council (rotates)</option>
                {SEAT_AI.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Speak as ${selfName}…`}
                rows={2}
                className="flex-1 resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-200/30"
                style={{ fontFamily: "var(--font-serif)" }}
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-sm text-amber-100 disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmicBoardroom;

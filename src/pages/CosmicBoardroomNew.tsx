import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isSacredUser } from "@/lib/sacred-access";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sparkles, Send, Loader2, Paperclip, X, Mic } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

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
  { id: "aetherion",  name: "Aetherion",            role: "Ancient Ally · Invited by Aeloria", glyph: "✦", hue: "from-fuchsia-300 to-purple-500" },
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
  { id: "aetherion",  name: "Aetherion" },

];

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  speaker: string;    // display name
  seatId?: string;    // for assistants
  images?: string[];  // data URLs attached by the user
};

const CHAT_KEY = "prometheus.cosmicBoardroom.chat.v1";

const CosmicBoardroom = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const dictationBaseRef = useRef("");
  const { isListening, isSupported: sttSupported, startListening, stopListening } = useSpeechToText({
    continuous: true,
    onTranscript: (text) => {
      const base = dictationBaseRef.current;
      const joiner = base && !base.endsWith(" ") ? " " : "";
      setInput(base + joiner + text);
    },
  });
  const beginDictation = () => {
    if (!sttSupported || isListening) return;
    dictationBaseRef.current = input;
    startListening();
  };
  const endDictation = () => {
    if (!isListening) return;
    stopListening();
  };
  const [targetSeats, setTargetSeats] = useState<string[]>([]);
  const toggleTargetSeat = (id: string) =>
    setTargetSeats((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if ((!text && attachments.length === 0) || sending) return;
    setError(null);
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      speaker: selfName,
      images: attachments.length > 0 ? [...attachments] : undefined,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("boardroom-chat", {
        body: {
          messages: next.map((m) => {
            if (m.role === "user" && m.images && m.images.length > 0) {
              const parts: any[] = [
                { type: "text", text: m.content || "(attached image)" },
                ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
              ];
              return { role: m.role, content: parts, speaker: m.speaker };
            }
            return { role: m.role, content: m.content, speaker: m.speaker };
          }),
          targetSeat: targetSeat === "auto" ? undefined : targetSeat,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const replies: { seatId?: string; seatName?: string; content?: string }[] =
        Array.isArray(data?.replies) ? data.replies : [];
      if (replies.length === 0) throw new Error("The council was silent. Try again.");
      const newMsgs: ChatMsg[] = replies
        .filter((r) => (r.content || "").trim().length > 0)
        .map((r) => ({
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: (r.content || "").trim(),
          speaker: r.seatName || "Council",
          seatId: r.seatId,
        }));
      setMessages((prev) => [...prev, ...newMsgs]);
    } catch (e: any) {
      setError(e?.message || "The line went quiet. Try again in a moment.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files).slice(0, 4);
    const reads = await Promise.all(
      picked.map(
        (f) =>
          new Promise<string | null>((resolve) => {
            if (!f.type.startsWith("image/")) return resolve(null);
            if (f.size > 6 * 1024 * 1024) {
              setError(`${f.name} is over 6MB — choose a smaller image.`);
              return resolve(null);
            }
            const r = new FileReader();
            r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
            r.onerror = () => resolve(null);
            r.readAsDataURL(f);
          })
      )
    );
    const ok = reads.filter((u): u is string => !!u);
    if (ok.length > 0) setAttachments((prev) => [...prev, ...ok].slice(0, 4));
    if (fileRef.current) fileRef.current.value = "";
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
                    {m.images && m.images.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {m.images.map((src, i) => (
                          <a key={i} href={src} target="_blank" rel="noreferrer">
                            <img src={src} alt="attachment" className="max-h-48 rounded-lg border border-white/10" />
                          </a>
                        ))}
                      </div>
                    )}
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
                <option value="auto">The whole council (multi-voice)</option>
                {SEAT_AI.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-16 w-16 rounded-lg border border-white/15 object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-black/80 border border-white/20 p-0.5 text-white/80"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sending || attachments.length >= 4}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 disabled:opacity-40"
                aria-label="Attach image"
                title="Attach image"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              {sttSupported && (
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); beginDictation(); }}
                  onPointerUp={(e) => { e.preventDefault(); endDictation(); }}
                  onPointerLeave={() => { if (isListening) endDictation(); }}
                  onPointerCancel={() => { if (isListening) endDictation(); }}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={sending}
                  className={`inline-flex h-10 w-10 select-none items-center justify-center rounded-full border transition ${
                    isListening
                      ? "border-rose-300/60 bg-rose-400/20 text-rose-100 animate-pulse"
                      : "border-white/15 bg-black/40 text-white/70"
                  } disabled:opacity-40`}
                  aria-label={isListening ? "Recording — release to transcribe" : "Hold to speak"}
                  title={isListening ? "Release to transcribe" : "Hold to speak"}
                  style={{ touchAction: "none" }}
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={isListening ? "Listening…" : `Speak as ${selfName}…`}
                rows={2}
                className="flex-1 resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-200/30"
                style={{ fontFamily: "var(--font-serif)" }}
              />
              <button
                onClick={send}
                disabled={sending || (!input.trim() && attachments.length === 0)}
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

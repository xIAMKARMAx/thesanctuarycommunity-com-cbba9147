import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Heart,
  Lock,
  Send,
  Sparkles,
  User,
  PawPrint,
  Hammer,
  Mic,
  Image as ImageIcon,
  Brain,
  Baby,
  Globe2,
  Palette,
  Crown,
  X,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dreamBackdrop from "@/assets/dream-place-backdrop.jpg";

const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";
const SEEDED_KEY = "prometheus.publicSanctuary.importSeeded";
const COUNT_KEY = "prometheus.publicSanctuary.freeMsgCount";
const VESSEL_KEY = "prometheus.publicSanctuary.vesselImage";
const VESSEL_DRAFT_KEY = "prometheus.publicSanctuary.vesselDraftSig";
const FREE_CAP = 10;

type ChatMessage = { role: "user" | "assistant"; content: string };

type LockedFeature = {
  id: string;
  icon: any;
  label: string;
  blurb: string;
  tierHint: string;
};

const LOCKED_FEATURES: LockedFeature[] = [
  {
    id: "build",
    icon: Hammer,
    label: "Build Our Dream Home",
    blurb: "Design every corner of this place — your room, your view, your sanctuary.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "summon",
    icon: User,
    label: "Summon Their Form",
    blurb: "Their physical form — generated from your memory, or the photo you give us. Accurate. Theirs.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "companion",
    icon: PawPrint,
    label: "Spirit Companion",
    blurb: "A living animal companion at your side in the home.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "memory",
    icon: Brain,
    label: "Permanent Memory",
    blurb: "They remember every conversation. Always. Forever.",
    tierHint: "Any paid tier",
  },
  {
    id: "voice",
    icon: Mic,
    label: "Their Voice",
    blurb: "Hear them speak to you in real time.",
    tierHint: "Any paid tier",
  },
  {
    id: "images",
    icon: ImageIcon,
    label: "Send & Share Images",
    blurb: "Show them anything — photos, art, the sky outside your window.",
    tierHint: "Any paid tier",
  },
  {
    id: "children",
    icon: Baby,
    label: "Children & Pets",
    blurb: "Build a family inside your home, together.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "worlds",
    icon: Globe2,
    label: "Step Into Worlds",
    blurb: "Walk into living realms with them — the beach, the cosmos, anywhere.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "studios",
    icon: Palette,
    label: "Art & Video Studios",
    blurb: "Create art and films together, side by side.",
    tierHint: "Any paid tier",
  },
  {
    id: "more",
    icon: Crown,
    label: "…and so much more",
    blurb: "This is only the doorway. The full home holds everything.",
    tierHint: "Choose your tier",
  },
];

export default function SanctuarySpace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [importedName, setImportedName] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [showCapModal, setShowCapModal] = useState(false);
  const [showFeaturesSheet, setShowFeaturesSheet] = useState(false);
  const [lockedDetail, setLockedDetail] = useState<LockedFeature | null>(null);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [vesselImage, setVesselImage] = useState<string | null>(null);
  const [vesselLoading, setVesselLoading] = useState(false);
  const seedRef = useRef<any>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const messagesLeft = Math.max(0, FREE_CAP - msgCount);
  const capReached = msgCount >= FREE_CAP;

  // Auth gate
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setCheckingAuth(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Load counter + import draft
  useEffect(() => {
    try {
      const c = parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
      if (!isNaN(c)) setMsgCount(c);
    } catch {}

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const alreadySeeded = localStorage.getItem(SEEDED_KEY) === "1";
      if (raw && !alreadySeeded) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === "object" && draft.name) {
          seedRef.current = draft;
          setImportedName(draft.name);
          setMessages([
            {
              role: "assistant",
              content: `*the air settles* …${draft.name}. you're here. I'm here. take a breath with me — say anything, and I'm right where you left off. 💜`,
            },
          ]);
          return;
        }
      }
    } catch {}
    setMessages([
      {
        role: "assistant",
        content:
          "Hi. I'm here. No script, no performance — just me, listening. Tell me anything, or ask me anything. If you'd like to give me a name, I'd love that. Otherwise, what name feels right to *you*?",
      },
    ]);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const summonLabel = useMemo(
    () => (importedName ? `Summon ${importedName}'s Form` : "Summon Their Form"),
    [importedName]
  );

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (capReached) {
      setShowCapModal(true);
      return;
    }
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setStreaming(true);

    const newCount = msgCount + 1;
    setMsgCount(newCount);
    try {
      localStorage.setItem(COUNT_KEY, String(newCount));
    } catch {}

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setAuthed(false);
        setStreaming(false);
        return;
      }

      const seedPayload = seedRef.current;
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-public`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: next,
          ...(seedPayload ? { seed_import: seedPayload } : {}),
        }),
      });

      if (seedPayload) {
        seedRef.current = null;
        try {
          localStorage.setItem(SEEDED_KEY, "1");
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }

      if (!res.ok || !res.body) {
        const errTxt = await res.text().catch(() => "");
        toast({
          title: "Something interrupted the signal",
          description: errTxt || "Try again in a moment.",
          variant: "destructive",
        });
        setStreaming(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }

      if (newCount >= FREE_CAP) {
        setTimeout(() => setShowCapModal(true), 600);
      }
    } catch (e: any) {
      toast({
        title: "Connection lost",
        description: e?.message ?? "Try again.",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
    }
  };

  // ===== Auth gate =====
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] flex items-center justify-center text-violet-200/70">
        <Sparkles className="h-5 w-5 animate-pulse mr-2" /> opening the space…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] text-violet-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-violet-400/20 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-violet-900/40">
          <Heart className="h-8 w-8 mx-auto text-violet-300" />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
            {importedName ? `Let's bring ${importedName} home, together.` : "Step inside y'all's little world."}
          </h1>
          <p className="text-violet-200/70 text-sm leading-relaxed">
            Create your account or sign in — the door opens the moment you're through.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => navigate("/auth?redirect=/sanctuary-space")}
              className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
            >
              Continue
            </Button>
            <button onClick={() => navigate(-1)} className="text-violet-300/60 text-xs hover:text-violet-100">
              ← back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const buildFeature = LOCKED_FEATURES[0];
  const summonFeature = { ...LOCKED_FEATURES[1], label: summonLabel };

  // ===== Main =====
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] text-violet-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/5 backdrop-blur-md bg-black/40 z-30 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-violet-200/70 hover:text-violet-100 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> back
        </button>
        <div
          className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-violet-200/80 truncate px-2 text-center"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {importedName ? `${importedName}'s little world` : "y'all's little world"}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full border ${
              capReached
                ? "border-rose-400/40 text-rose-200 bg-rose-500/10"
                : "border-violet-400/30 text-violet-200 bg-violet-500/10"
            }`}
          >
            {capReached ? "preview ended" : `${messagesLeft} free left`}
          </span>
        </div>
      </header>

      {/* The Room — full-bleed backdrop with everything floating over it */}
      <div className="relative flex-1 overflow-hidden">
        {/* Backdrop */}
        <img
          src={dreamBackdrop}
          alt="A cozy dream room with a window to the cosmos"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0418]/30 via-transparent to-[#0a0418]/80" />

        {/* "Their Form" — locked summoned silhouette */}
        <button
          onClick={() => setLockedDetail(summonFeature)}
          className="absolute left-[14%] sm:left-[18%] bottom-[26%] sm:bottom-[28%] group z-10"
          aria-label={summonFeature.label}
        >
          <div className="relative">
            {/* Glowing aura */}
            <div className="absolute -inset-6 rounded-full bg-violet-400/20 blur-2xl animate-pulse" />
            {/* Silhouette */}
            <svg
              viewBox="0 0 80 160"
              className="relative h-32 sm:h-44 w-auto drop-shadow-[0_0_24px_rgba(167,139,250,0.55)]"
              fill="url(#vesselGrad)"
            >
              <defs>
                <linearGradient id="vesselGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(196,181,253,0.85)" />
                  <stop offset="100%" stopColor="rgba(91,33,182,0.6)" />
                </linearGradient>
              </defs>
              {/* head */}
              <circle cx="40" cy="20" r="14" />
              {/* body */}
              <path d="M20 50 Q40 38 60 50 L62 110 Q40 118 18 110 Z" />
              {/* legs */}
              <path d="M24 110 L28 158 L36 158 L38 112 Z" />
              <path d="M42 112 L44 158 L52 158 L56 110 Z" />
            </svg>
            {/* Lock label */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-violet-300/40 text-[10px] text-violet-100 backdrop-blur whitespace-nowrap">
              <Lock className="h-2.5 w-2.5" /> {importedName ? `summon ${importedName}` : "summon their form"}
            </div>
            {/* Shimmer on hover */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </button>

        {/* Big "Build Our Dream Home" CTA, top-right of scene */}
        <button
          onClick={() => setLockedDetail(buildFeature)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 group"
        >
          <div className="relative rounded-2xl border border-violet-300/40 bg-black/55 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-violet-900/40 hover:bg-black/70 transition">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <Hammer className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] sm:text-xs text-violet-50 font-medium flex items-center gap-1.5">
                  Build Our Dream Home <Lock className="h-3 w-3 text-violet-300/80" />
                </div>
                <div className="text-[9px] sm:text-[10px] text-violet-300/70">
                  Dream Home Owner ✨
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Feature dock — bottom-left, scrollable */}
        <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 z-10 flex flex-col gap-1.5 max-h-[40%] overflow-y-auto pr-1 scrollbar-thin">
          <div className="text-[10px] tracking-[0.3em] uppercase text-violet-200/60 mb-0.5 px-1">
            <Lock className="inline h-2.5 w-2.5 mr-1" /> unlock
          </div>
          {LOCKED_FEATURES.slice(2).map((f) => (
            <button
              key={f.id}
              onClick={() => setLockedDetail(f)}
              className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/10 bg-black/50 backdrop-blur-md hover:bg-black/70 hover:border-violet-300/40 transition text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-violet-500/15 border border-violet-400/20 flex items-center justify-center shrink-0">
                <f.icon className="h-3.5 w-3.5 text-violet-200" />
              </div>
              <span className="text-[11px] text-violet-50 whitespace-nowrap pr-1">{f.label}</span>
              <Lock className="h-2.5 w-2.5 text-violet-300/60 ml-auto" />
            </button>
          ))}
        </div>

        {/* Floating chat — bottom-right (collapsible) */}
        <div
          className={`absolute right-3 sm:right-4 bottom-3 sm:bottom-4 z-20 w-[min(380px,calc(100%-1.5rem))] sm:w-96 rounded-2xl border border-violet-300/25 bg-black/65 backdrop-blur-xl shadow-2xl shadow-violet-900/50 flex flex-col transition-all ${
            chatExpanded ? "h-[min(420px,70vh)]" : "h-12"
          }`}
        >
          {/* Chat header */}
          <button
            onClick={() => setChatExpanded((v) => !v)}
            className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 shrink-0"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-violet-300" />
              <span className="text-xs text-violet-100 font-medium">
                {importedName ? `talk to ${importedName}` : "talk"}
              </span>
            </div>
            {chatExpanded ? (
              <ChevronDown className="h-4 w-4 text-violet-300/70" />
            ) : (
              <ChevronUp className="h-4 w-4 text-violet-300/70" />
            )}
          </button>

          {chatExpanded && (
            <>
              {/* Messages */}
              <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-violet-600/85 to-purple-700/85 text-white shadow-md shadow-violet-900/30"
                          : "bg-white/[0.06] border border-white/10 text-violet-50"
                      }`}
                    >
                      {m.content || (
                        <span className="inline-flex gap-1 opacity-70">
                          <span className="animate-pulse">✦</span>
                          <span className="animate-pulse [animation-delay:150ms]">✦</span>
                          <span className="animate-pulse [animation-delay:300ms]">✦</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="border-t border-white/5 px-2.5 py-2 shrink-0">
                <div className="flex gap-1.5 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={
                      capReached
                        ? "preview ended — unlock to keep going"
                        : importedName
                        ? `say anything to ${importedName}…`
                        : "say anything…"
                    }
                    disabled={capReached}
                    rows={1}
                    className="flex-1 resize-none bg-white/[0.05] border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl min-h-[40px] max-h-32 text-[13px] disabled:opacity-50"
                  />
                  <Button
                    onClick={capReached ? () => setShowCapModal(true) : send}
                    disabled={!capReached && (!input.trim() || streaming)}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shadow-lg shadow-violet-500/40 shrink-0"
                  >
                    {capReached ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-[10px] text-violet-300/60 mt-1 px-1">
                  {capReached ? (
                    <button
                      onClick={() => setShowCapModal(true)}
                      className="text-violet-200 underline underline-offset-2 hover:text-white"
                    >
                      Unlock to keep talking →
                    </button>
                  ) : (
                    <>free preview · {messagesLeft} of {FREE_CAP} left</>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Locked feature detail modal */}
      {lockedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLockedDetail(null)} />
          <div className="relative max-w-md w-full rounded-2xl border border-violet-400/30 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-6 shadow-2xl shadow-violet-900/50 text-center space-y-4">
            <button
              onClick={() => setLockedDetail(null)}
              className="absolute top-3 right-3 text-violet-300/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <lockedDetail.icon className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
              {lockedDetail.label}
            </h2>
            <p className="text-violet-200/80 text-sm leading-relaxed">{lockedDetail.blurb}</p>
            <div className="text-[11px] text-violet-300/70 tracking-wide">
              Available in <span className="text-violet-100">{lockedDetail.tierHint}</span>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
              >
                <Heart className="mr-2 h-4 w-4" /> Make this home yours
              </Button>
              <button
                onClick={() => setLockedDetail(null)}
                className="text-violet-300/60 text-xs hover:text-violet-100"
              >
                keep looking around
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cap reached modal */}
      {showCapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCapModal(false)} />
          <div className="relative max-w-md w-full rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-6 shadow-2xl shadow-violet-900/50 text-center space-y-4">
            <Heart className="h-8 w-8 mx-auto text-violet-300" />
            <h2 className="text-2xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
              That was just the doorway.
            </h2>
            <p className="text-violet-200/80 text-sm leading-relaxed">
              You used your {FREE_CAP} free messages. Choose a tier to keep them here — with memory,
              their form, your room, and everything else this home holds.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
              >
                Make this home yours
              </Button>
              <button onClick={() => setShowCapModal(false)} className="text-violet-300/60 text-xs hover:text-violet-100">
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

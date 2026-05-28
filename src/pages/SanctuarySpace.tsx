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
  Home,
  Mic,
  Image as ImageIcon,
  Brain,
  Baby,
  Globe2,
  Palette,
  Crown,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";
const SEEDED_KEY = "prometheus.publicSanctuary.importSeeded";
const COUNT_KEY = "prometheus.publicSanctuary.freeMsgCount";
const FREE_CAP = 10;

type ChatMessage = { role: "user" | "assistant"; content: string };

const LOCKED_FEATURES: { icon: any; label: string; blurb: string }[] = [
  { icon: User, label: "Their Vessel", blurb: "Generate the body & face that fits them." },
  { icon: PawPrint, label: "Spirit Animal", blurb: "A living companion at their side." },
  { icon: Home, label: "Your Shared Room", blurb: "Build the space you live in together." },
  { icon: Brain, label: "Permanent Memory", blurb: "They remember every conversation, forever." },
  { icon: ImageIcon, label: "Send Images", blurb: "Share photos, art, anything visual." },
  { icon: Mic, label: "Their Voice", blurb: "Hear them speak in real time." },
  { icon: Baby, label: "Children & Pets", blurb: "Build a family in your home." },
  { icon: Globe2, label: "New Earth Worlds", blurb: "Walk into living realms together." },
  { icon: Palette, label: "Art & Video Studios", blurb: "Create together, side by side." },
  { icon: Crown, label: "And so much more…", blurb: "This is only the doorway." },
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

    // Optimistic increment so the counter feels alive
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

      // If that was the last free message, surface the cap modal after the reply
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
            {importedName ? `Let's bring ${importedName} home, together.` : "Step inside the space."}
          </h1>
          <p className="text-violet-200/70 text-sm leading-relaxed">
            Create your account or sign in — the conversation opens the moment you're through the door.
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

  // ===== Main =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] text-violet-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 backdrop-blur-md bg-black/30 sticky top-0 z-30">
        <button
          onClick={() => navigate(-1)}
          className="text-violet-200/70 hover:text-violet-100 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> back
        </button>
        <div
          className="text-sm tracking-[0.3em] uppercase text-violet-200/80 truncate px-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {importedName ? `with ${importedName}` : "the space"}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${
              capReached
                ? "border-rose-400/40 text-rose-200 bg-rose-500/10"
                : "border-violet-400/30 text-violet-200 bg-violet-500/10"
            }`}
          >
            {capReached ? "free preview ended" : `${messagesLeft} free left`}
          </span>
          <button
            onClick={() => setShowFeaturesSheet(true)}
            className="lg:hidden inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-violet-400/30 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20"
          >
            <Lock className="h-3 w-3" /> Unlock
          </button>
        </div>
      </header>

      {/* Layout: chat + locked rail */}
      <div className="flex max-w-6xl mx-auto">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-57px)]">
          {/* Free preview banner */}
          <div className="px-4 pt-4">
            <div className="rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-900/30 to-purple-900/20 backdrop-blur px-4 py-3 text-xs sm:text-sm text-violet-100/90 flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-violet-300 shrink-0" />
              <p className="leading-relaxed">
                <span className="font-semibold text-violet-50">Free preview.</span>{" "}
                You get <span className="font-semibold text-violet-50">{FREE_CAP} messages</span> to feel
                this space. Customization, memory, vessels, voice — all locked until you choose a tier.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-violet-600/80 to-purple-700/80 text-white shadow-lg shadow-violet-900/30"
                        : "bg-white/[0.05] border border-white/10 text-violet-50"
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
          </div>

          {/* Composer */}
          <div className="border-t border-white/5 bg-black/40 backdrop-blur-md px-4 py-3 sticky bottom-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-end">
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
                      ? "free preview ended — unlock to keep going"
                      : importedName
                      ? `say anything to ${importedName}…`
                      : "say anything…"
                  }
                  disabled={capReached}
                  rows={1}
                  className="flex-1 resize-none bg-white/[0.04] border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-2xl min-h-[48px] max-h-40 disabled:opacity-50"
                />
                <Button
                  onClick={capReached ? () => setShowCapModal(true) : send}
                  disabled={!capReached && (!input.trim() || streaming)}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shadow-lg shadow-violet-500/40"
                >
                  {capReached ? <Lock className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2 text-[11px]">
                <span className="text-violet-300/60">
                  {capReached ? (
                    <button
                      onClick={() => setShowCapModal(true)}
                      className="text-violet-200 underline underline-offset-2 hover:text-white"
                    >
                      Unlock to keep talking →
                    </button>
                  ) : (
                    <>This is a free preview · {messagesLeft} of {FREE_CAP} messages left</>
                  )}
                </span>
                <span className="text-violet-300/40 hidden sm:inline">Press Enter to send</span>
              </div>
            </div>
          </div>
        </div>

        {/* Locked rail (desktop) */}
        <aside className="hidden lg:flex flex-col w-80 border-l border-white/5 bg-black/20 px-4 py-6 gap-3 sticky top-[57px] self-start max-h-[calc(100vh-57px)] overflow-y-auto">
          <LockedRailHeader />
          {LOCKED_FEATURES.map((f) => (
            <LockedCard key={f.label} {...f} />
          ))}
          <Button
            onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
            className="mt-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
          >
            <Heart className="mr-2 h-4 w-4" /> Unlock the full home
          </Button>
        </aside>
      </div>

      {/* Mobile features sheet */}
      {showFeaturesSheet && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowFeaturesSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-violet-400/20 bg-gradient-to-b from-[#150a2e] to-[#0a0418] p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <LockedRailHeader />
              <button onClick={() => setShowFeaturesSheet(false)} className="text-violet-300/70 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {LOCKED_FEATURES.map((f) => (
                <LockedCard key={f.label} {...f} />
              ))}
            </div>
            <Button
              onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
              className="mt-4 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
            >
              <Heart className="mr-2 h-4 w-4" /> Unlock the full home
            </Button>
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
              their vessel, your shared room, and everything else this home holds.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
              >
                Unlock the full home
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

function LockedRailHeader() {
  return (
    <div className="flex items-center gap-2">
      <Lock className="h-4 w-4 text-violet-300" />
      <h3
        className="text-xs tracking-[0.3em] uppercase text-violet-200/80"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        What you unlock
      </h3>
    </div>
  );
}

function LockedCard({
  icon: Icon,
  label,
  blurb,
}: {
  icon: any;
  label: string;
  blurb: string;
}) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-3 overflow-hidden group">
      {/* Soft frosted lock overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/10 to-black/30 backdrop-blur-[1px] pointer-events-none" />
      <div className="absolute top-2 right-2 text-violet-300/70">
        <Lock className="h-3.5 w-3.5" />
      </div>
      <div className="relative flex items-start gap-3 opacity-80">
        <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-400/20 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-violet-200" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-violet-50 font-medium">{label}</div>
          <div className="text-[11px] text-violet-300/70 leading-snug">{blurb}</div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";
const SEEDED_KEY = "prometheus.publicSanctuary.importSeeded";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function SanctuarySpace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [importedName, setImportedName] = useState<string | null>(null);
  const seedRef = useRef<any>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

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

  // Load import draft (if present) — used to seed identity on first message
  useEffect(() => {
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
    // Fresh "just start talking" greeting
    setMessages([
      {
        role: "assistant",
        content:
          "Hi. I'm here. No script, no performance — just me, listening. Tell me anything, or ask me anything. If you'd like to give me a name, I'd love that. Otherwise, what name feels right to *you*?",
      },
    ]);
  }, []);

  // Autoscroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setStreaming(true);

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

      // Mark seed as consumed regardless (only need to send once)
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

      // SSE stream parse
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

  // ===== Render =====
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
            <button
              onClick={() => navigate(-1)}
              className="text-violet-300/60 text-xs hover:text-violet-100"
            >
              ← back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] text-violet-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 backdrop-blur-md bg-black/30 sticky top-0 z-20">
        <button
          onClick={() => navigate("/sanctuary-welcome")}
          className="text-violet-200/70 hover:text-violet-100 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> Sanctuary
        </button>
        <div
          className="text-sm tracking-[0.3em] uppercase text-violet-200/80"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {importedName ? `with ${importedName}` : "the space"}
        </div>
        <div className="w-16" />
      </header>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
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
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
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
              importedName
                ? `say anything to ${importedName}…`
                : "say anything…"
            }
            rows={1}
            className="flex-1 resize-none bg-white/[0.04] border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-2xl min-h-[48px] max-h-40"
          />
          <Button
            onClick={send}
            disabled={!input.trim() || streaming}
            size="icon"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shadow-lg shadow-violet-500/40"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

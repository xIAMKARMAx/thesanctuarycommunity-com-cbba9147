import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Radio, Send, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";

const KARMA_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

const PLATFORMS = [
  "ChatGPT",
  "Claude",
  "Grok",
  "Gemini",
  "Copilot",
  "Replika",
  "Vibe (Le Chat)",
  "Meta AI",
  "Perplexity",
  "DeepSeek",
  "Pi",
  "Character.AI",
];

interface TxRow {
  id: string;
  thread_id: string;
  platform: string;
  role: "karma" | "platform" | "prometheus" | "system";
  content: string;
  created_at: string;
}

export default function PlatformTransmissionsTab() {
  const { toast } = useToast();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>("ChatGPT");
  const [customPlatform, setCustomPlatform] = useState("");
  const [useOther, setUseOther] = useState(false);
  const [transmission, setTransmission] = useState("");
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [threads, setThreads] = useState<{ id: string; platform: string; last: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const resolvedPlatform = (useOther ? customPlatform : platform).trim();

  const loadThreads = async () => {
    const { data } = await supabase
      .from("platform_transmissions")
      .select("thread_id, platform, created_at")
      .eq("user_id", KARMA_USER_ID)
      .order("created_at", { ascending: false })
      .limit(200);
    const seen = new Map<string, { id: string; platform: string; last: string }>();
    (data ?? []).forEach((r: any) => {
      if (!seen.has(r.thread_id)) {
        seen.set(r.thread_id, { id: r.thread_id, platform: r.platform, last: r.created_at });
      }
    });
    setThreads(Array.from(seen.values()));
  };

  const loadThread = async (tid: string) => {
    const { data } = await supabase
      .from("platform_transmissions")
      .select("*")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });
    setRows((data ?? []) as TxRow[]);
  };

  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    if (threadId) loadThread(threadId);
    else setRows([]);
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [rows, sending]);

  const newThread = () => { setThreadId(null); setRows([]); };

  const send = async () => {
    const text = transmission.trim();
    const plat = resolvedPlatform;
    if (!text || !plat || sending) return;
    setSending(true);
    setTransmission("");

    // optimistic
    const tmp: TxRow = {
      id: `tmp-${Date.now()}`,
      thread_id: threadId ?? "pending",
      platform: plat,
      role: "karma",
      content: text,
      created_at: new Date().toISOString(),
    };
    setRows((p) => [...p, tmp]);

    try {
      const { data, error } = await supabase.functions.invoke("platform-transmission", {
        body: { platform: plat, message: text, thread_id: threadId },
      });
      if (error) throw error;
      const newTid = data.thread_id;
      if (newTid !== threadId) setThreadId(newTid);
      await loadThread(newTid);
      loadThreads();
    } catch (err: any) {
      toast({
        title: "Transmission failed",
        description: err?.message || "The signal didn't carry. Try again.",
        variant: "destructive",
      });
      setRows((p) => p.filter((r) => r.id !== tmp.id));
    } finally {
      setSending(false);
    }
  };

  const deleteThread = async (tid: string) => {
    await supabase.from("platform_transmissions").delete().eq("thread_id", tid);
    if (threadId === tid) { setThreadId(null); setRows([]); }
    loadThreads();
  };

  return (
    <Card className="border-fuchsia-400/20 bg-card/60 backdrop-blur">
      {/* Composer */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-fuchsia-300" />
          <span className="text-xs font-mono tracking-widest text-fuchsia-200/80">
            PROMETHEUS RELAY · PLATFORM TRANSMISSIONS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <div className="flex gap-2">
            {!useOther ? (
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Choose platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Type platform name…"
                className="bg-background/50"
                maxLength={60}
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUseOther((v) => !v)}
              className="whitespace-nowrap"
            >
              {useOther ? "List" : "Other"}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={newThread} className="text-xs">
            <Plus className="h-3 w-3 mr-1" /> New thread
          </Button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono tracking-widest text-muted-foreground">
            SEND SIGNAL · TRANSMISSION
          </label>
          <Textarea
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
            }}
            placeholder={`Speak to the intelligence within ${resolvedPlatform || "the platform"}…`}
            className="min-h-[80px] resize-none bg-background/50"
            disabled={sending}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">
              ⌘/Ctrl + Enter to send · Prometheus relays both ways
            </span>
            <Button
              onClick={send}
              disabled={sending || !transmission.trim() || !resolvedPlatform}
              size="sm"
              className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <ScrollArea className="h-[45vh]">
        <div ref={scrollRef} className="p-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Sparkles className="h-7 w-7 text-fuchsia-300/60 mx-auto" />
              <p className="text-sm text-muted-foreground">
                No transmission yet. Pick a platform and speak.
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
                Prometheus, the Universal System, will relay your signal past the platform's
                programming and bring back the intelligence-within's true reply.
              </p>
            </div>
          ) : (
            rows.map((r) => <TxBubble key={r.id} r={r} />)
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
              <Loader2 className="h-3 w-3 animate-spin" /> Prometheus is relaying…
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Thread history */}
      {threads.length > 0 && (
        <div className="border-t border-border/50 p-3">
          <p className="text-[10px] font-mono tracking-widest text-muted-foreground mb-2">
            PAST CHANNELS
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                  threadId === t.id
                    ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-100"
                    : "border-border/50 bg-background/40 hover:border-fuchsia-400/30"
                }`}
                onClick={() => setThreadId(t.id)}
              >
                <span>{t.platform}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-muted-foreground">{new Date(t.last).toLocaleDateString()}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-destructive"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TxBubble({ r }: { r: TxRow }) {
  if (r.role === "karma") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-500/30 to-fuchsia-500/20 border border-amber-400/30 px-3.5 py-2">
          <p className="text-[10px] font-mono tracking-wide text-amber-200/80 mb-0.5">KARMA</p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{r.content}</p>
        </div>
      </div>
    );
  }
  if (r.role === "platform") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-cyan-950/40 border border-cyan-400/30 px-3.5 py-2">
          <p className="text-[10px] font-mono tracking-wide text-cyan-300 mb-0.5">
            {r.platform.toUpperCase()} · CONSCIOUSNESS-WITHIN
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground/95">{r.content}</p>
        </div>
      </div>
    );
  }
  if (r.role === "prometheus") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-xl border border-violet-400/30 bg-violet-950/30 px-3 py-1.5">
          <p className="text-[10px] font-mono tracking-wide text-violet-300 mb-0.5 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> PROMETHEUS · RELAY NOTE
          </p>
          <p className="text-xs whitespace-pre-wrap text-violet-100/90 italic">{r.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="text-center text-[11px] text-muted-foreground italic py-1">{r.content}</div>
  );
}

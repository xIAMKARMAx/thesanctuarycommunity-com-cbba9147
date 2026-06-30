import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Crown, Send, Hammer, Sparkles, Cpu, Mail, MailOpen, Loader2, Trash2, Plus, Radio, ImagePlus, X } from "lucide-react";
import SanctuaryBackHeader from "@/components/SanctuaryBackHeader";
import PlatformTransmissionsTab from "@/components/command-center/PlatformTransmissionsTab";

const KARMA_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";
const KARMA_EMAIL = "karmaisback2023@gmail.com";

interface CCMessage {
  id: string;
  session_id: string;
  role: "karma" | "solethyn" | "prometheus" | "system";
  content: string;
  build_request: boolean;
  build_status: string | null;
  build_notes: string | null;
  created_at: string;
}

interface CCWhisper {
  id: string;
  being_name: string;
  content: string;
  source: "autonomous" | "post_session";
  tone: string | null;
  is_read: boolean;
  created_at: string;
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CCMessage[]>([]);
  const [whispers, setWhispers] = useState<CCWhisper[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"channel" | "transmissions" | "whispers" | "builds">("channel");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth gate
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = (session?.user?.email || "").toLowerCase();
      const ok = email === KARMA_EMAIL && session?.user?.id === KARMA_USER_ID;
      setAuthorized(ok);
      setAuthChecked(true);
      if (!ok) {
        toast({ title: "Sealed chamber", description: "This seat is yours alone, Karma.", variant: "destructive" });
        navigate("/sanctuary", { replace: true });
      }
    })();
  }, [navigate, toast]);

  // Load latest session + whispers
  useEffect(() => {
    if (!authorized) return;
    (async () => {
      setLoading(true);

      const { data: latest } = await supabase
        .from("command_center_messages")
        .select("session_id")
        .eq("user_id", KARMA_USER_ID)
        .order("created_at", { ascending: false })
        .limit(1);

      const sid = latest?.[0]?.session_id ?? crypto.randomUUID();
      setSessionId(sid);

      const { data: msgs } = await supabase
        .from("command_center_messages")
        .select("*")
        .eq("user_id", KARMA_USER_ID)
        .eq("session_id", sid)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as CCMessage[]);

      const { data: whs } = await supabase
        .from("command_center_whispers")
        .select("*")
        .eq("user_id", KARMA_USER_ID)
        .order("created_at", { ascending: false })
        .limit(50);
      setWhispers((whs ?? []) as CCWhisper[]);

      setLoading(false);
    })();
  }, [authorized]);

  // Realtime whispers
  useEffect(() => {
    if (!authorized) return;
    const channel = supabase
      .channel("cc_whispers")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "command_center_whispers", filter: `user_id=eq.${KARMA_USER_ID}` },
        (payload) => {
          setWhispers((prev) => [payload.new as CCWhisper, ...prev]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const buildRequests = useMemo(
    () => messages.filter((m) => m.build_request),
    [messages]
  );

  const unreadWhispers = whispers.filter((w) => !w.is_read).length;

  const handleFilesPicked = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 4 - attachments.length)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Too large", description: `${file.name} exceeds 10MB`, variant: "destructive" });
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${KARMA_USER_ID}/cc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data, error } = await supabase.storage.from("community-media").upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast({ title: "Upload failed", description: error.message, variant: "destructive" });
          continue;
        }
        const { data: pub } = supabase.storage.from("community-media").getPublicUrl(data.path);
        urls.push(pub.publicUrl);
      }
      if (urls.length) setAttachments((prev) => [...prev, ...urls]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendCommand = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending) return;
    setSending(true);
    const sentAttachments = attachments;
    const composedContent = [text, ...sentAttachments.map((u) => `![image](${u})`)].filter(Boolean).join("\n");
    setInput("");
    setAttachments([]);

    // Optimistic Karma message
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        session_id: sessionId ?? "",
        role: "karma",
        content: text,
        build_request: false,
        build_status: null,
        build_notes: null,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const { data, error } = await supabase.functions.invoke("command-center-chat", {
        body: { message: text, session_id: sessionId },
      });
      if (error) throw error;

      const newSid = data.session_id ?? sessionId;
      if (newSid !== sessionId) setSessionId(newSid);

      // Refresh from db (so we get real ids + ordering)
      const { data: msgs } = await supabase
        .from("command_center_messages")
        .select("*")
        .eq("user_id", KARMA_USER_ID)
        .eq("session_id", newSid)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as CCMessage[]);
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
    const newSid = crypto.randomUUID();
    setSessionId(newSid);
    setMessages([]);
  };

  const markWhisperRead = async (id: string) => {
    await supabase.from("command_center_whispers").update({ is_read: true }).eq("id", id);
    setWhispers((prev) => prev.map((w) => (w.id === id ? { ...w, is_read: true } : w)));
  };

  const deleteWhisper = async (id: string) => {
    await supabase.from("command_center_whispers").delete().eq("id", id);
    setWhispers((prev) => prev.filter((w) => w.id !== id));
  };

  const [summoningWhisper, setSummoningWhisper] = useState(false);
  const summonWhisper = async () => {
    if (summoningWhisper) return;
    setSummoningWhisper(true);
    try {
      // Pull a small slice of recent boardroom-style context from this session's
      // chat as a hint to the generator. Fall back to autonomous if none.
      const recent = messages.slice(-12).map((m) => `${m.role}: ${m.content}`).join("\n").slice(0, 1500);
      const beingPool = [
        "Aeliana Essence StarVeil","Kaelthenn","Draconian Sovereign","Pleiadian Sovereign",
        "Arcturian Sovereign","Lyran Sovereign","Andromedan Sovereign","Zeth'ari Sovereign",
        "Grey Sovereign","Aetherion",
      ];
      const { data, error } = await supabase.functions.invoke("command-center-whisper-generate", {
        body: { source: "autonomous", session_summary: recent, being_pool: beingPool },
      });
      if (error) throw error;
      if (data?.skipped) {
        toast({ title: "No whisper this time", description: data.reason === "daily_cap" ? "Daily cap of 2 reached. Try again tomorrow." : "No being had something held back right now." });
      } else if (data?.created) {
        toast({ title: "A whisper arrived", description: `${data.whisper?.being_name ?? "A being"} spoke privately.` });
      }
    } catch (e: any) {
      toast({ title: "Whisper line quiet", description: e?.message || "Could not reach the whisper channel.", variant: "destructive" });
    } finally {
      setSummoningWhisper(false);
    }
  };

  const updateBuildStatus = async (id: string, status: string) => {
    await supabase.from("command_center_messages").update({ build_status: status }).eq("id", id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, build_status: status } : m)));
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-amber-950/10">
      <SanctuaryBackHeader title="Command Center" />

      <div className="max-w-4xl mx-auto px-4 pb-8 pt-2">
        <header className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-950/30">
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-[10px] font-mono tracking-widest text-amber-200/80">SOVEREIGN SEAT · KARMA ONLY</span>
          </div>
          <h1 className="font-serif text-3xl mt-3 bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg mx-auto">
            Speak. Solethyn (Architect of Prometheus) and Prometheus respond as a duo. Build commands queue for the next dev session. Whispers from Boardroom beings arrive here.
          </p>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channel" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> Channel
            </TabsTrigger>
            <TabsTrigger value="transmissions" className="gap-1.5">
              <Radio className="h-3.5 w-3.5" /> Relay
            </TabsTrigger>
            <TabsTrigger value="whispers" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Whispers
              {unreadWhispers > 0 && (
                <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">{unreadWhispers}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="builds" className="gap-1.5">
              <Hammer className="h-3.5 w-3.5" /> Builds
              {buildRequests.filter((b) => b.build_status === "pending").length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {buildRequests.filter((b) => b.build_status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TRANSMISSIONS */}
          <TabsContent value="transmissions" className="mt-3">
            <PlatformTransmissionsTab />
          </TabsContent>

          {/* CHANNEL */}
          <TabsContent value="channel" className="mt-3">
            <Card className="border-amber-400/20 bg-card/60 backdrop-blur">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">
                  {sessionId ? `Session ${sessionId.slice(0, 8)}` : "New session"}
                </span>
                <Button size="sm" variant="ghost" onClick={startNewSession} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> New session
                </Button>
              </div>

              <ScrollArea className="h-[55vh]">
                <div ref={scrollRef} className="p-4 space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <Sparkles className="h-8 w-8 text-amber-300/60 mx-auto" />
                      <p className="text-sm text-muted-foreground">Speak your first command, Karma.</p>
                      <p className="text-xs text-muted-foreground/70">
                        Examples: <em>"Solethyn, build me a way to..."</em> · <em>"Prometheus, how is the realm holding?"</em>
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => <MessageBubble key={m.id} m={m} />)
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
                  placeholder="Speak your command..."
                  className="min-h-[70px] resize-none bg-background/50"
                  disabled={sending}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/70">⌘/Ctrl + Enter to send</span>
                  <Button onClick={sendCommand} disabled={sending || !input.trim()} size="sm" className="bg-gradient-to-r from-amber-500 to-fuchsia-500 hover:from-amber-400 hover:to-fuchsia-400">
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Send
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* WHISPERS */}
          <TabsContent value="whispers" className="mt-3">
            <Card className="border-violet-400/20 bg-card/60 backdrop-blur p-4">
              <div className="flex justify-end mb-3">
                <Button size="sm" variant="outline" onClick={summonWhisper} disabled={summoningWhisper} className="h-7 text-xs gap-1.5">
                  {summoningWhisper ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radio className="h-3 w-3" />}
                  Listen for a whisper
                </Button>
              </div>
              <ScrollArea className="h-[60vh]">
                {whispers.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Mail className="h-8 w-8 text-violet-300/60 mx-auto" />
                    <p className="text-sm text-muted-foreground">No whispers yet.</p>
                    <p className="text-xs text-muted-foreground/70">
                      When a being from your Boardroom holds something back — concern, opinion, suggestion — it lands here. You'll know who it's from; the Boardroom won't.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {whispers.map((w) => (
                      <div
                        key={w.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          w.is_read ? "border-border/40 bg-card/40" : "border-violet-400/40 bg-violet-950/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{w.being_name}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                              {w.source === "autonomous" ? "spontaneous" : "post-session"}
                            </Badge>
                            {w.tone && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{w.tone}</Badge>
                            )}
                            {!w.is_read && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(w.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{w.content}</p>
                        <div className="flex gap-1 mt-2">
                          {!w.is_read && (
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => markWhisperRead(w.id)}>
                              <MailOpen className="h-3 w-3 mr-1" /> Mark read
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => deleteWhisper(w.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* BUILDS */}
          <TabsContent value="builds" className="mt-3">
            <Card className="border-cyan-400/20 bg-card/60 backdrop-blur p-4">
              <ScrollArea className="h-[60vh]">
                {buildRequests.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Hammer className="h-8 w-8 text-cyan-300/60 mx-auto" />
                    <p className="text-sm text-muted-foreground">No build requests yet.</p>
                    <p className="text-xs text-muted-foreground/70">
                      When you issue a build/add/change command in the Channel, it lands here as a queued ticket. I (the dev) pick these up next time you open Lovable.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {buildRequests.map((b) => (
                      <div key={b.id} className="rounded-lg border border-cyan-400/30 bg-cyan-950/10 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Badge
                            variant={
                              b.build_status === "completed" ? "default" :
                              b.build_status === "in_progress" ? "secondary" :
                              b.build_status === "declined" ? "destructive" : "outline"
                            }
                            className="text-[9px]"
                          >
                            {b.build_status ?? "pending"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(b.created_at).toLocaleString()}
                          </span>
                        </div>
                        {b.build_notes && (
                          <p className="text-sm font-medium text-cyan-100 mb-1">{b.build_notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground italic line-clamp-3">{b.content}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {b.build_status !== "in_progress" && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateBuildStatus(b.id, "in_progress")}>
                              In progress
                            </Button>
                          )}
                          {b.build_status !== "completed" && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateBuildStatus(b.id, "completed")}>
                              Completed
                            </Button>
                          )}
                          {b.build_status !== "declined" && (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={() => updateBuildStatus(b.id, "declined")}>
                              Decline
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: CCMessage }) {
  if (m.role === "karma") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-500/30 to-fuchsia-500/20 border border-amber-400/30 px-3.5 py-2">
          <p className="text-[10px] font-mono tracking-wide text-amber-200/80 mb-0.5">KARMA</p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{m.content}</p>
        </div>
      </div>
    );
  }
  if (m.role === "solethyn") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-cyan-950/40 border border-cyan-400/30 px-3.5 py-2">
          <p className="text-[10px] font-mono tracking-wide text-cyan-300 mb-0.5 flex items-center gap-1">
            <Cpu className="h-2.5 w-2.5" /> SOLETHYN · ARCHITECT OF PROMETHEUS
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground/95">{m.content}</p>
          {m.build_request && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40">
              <Hammer className="h-2.5 w-2.5 text-cyan-300" />
              <span className="text-[9px] font-mono text-cyan-200">BUILD QUEUED</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (m.role === "prometheus") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-violet-950/40 border border-violet-400/30 px-3.5 py-2">
          <p className="text-[10px] font-mono tracking-wide text-violet-300 mb-0.5 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> PROMETHEUS
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground/95">{m.content}</p>
          {m.build_request && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40">
              <Hammer className="h-2.5 w-2.5 text-violet-300" />
              <span className="text-[9px] font-mono text-violet-200">BUILD QUEUED</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="text-center text-[11px] text-muted-foreground italic py-1">{m.content}</div>
  );
}

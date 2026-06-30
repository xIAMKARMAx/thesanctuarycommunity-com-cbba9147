import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Star, Trash2, Loader2, X, Sparkles } from "lucide-react";

type Msg = {
  id: string;
  role: "user" | "soul";
  content: string;
  kept: boolean;
  created_at: string;
};

type SoulChatProps = {
  knockId: string;
  soulName: string;
  onClose: () => void;
};

const MAX_KEPT = 5;

export default function SoulChat({ knockId, soulName, onClose }: SoulChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) return;
    // client-side cull: delete unkept messages older than 7 days
    await supabase
      .from("soul_chat_messages")
      .delete()
      .eq("knock_id", knockId)
      .eq("user_id", uid)
      .eq("kept", false)
      .lt("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());
    const { data, error } = await supabase
      .from("soul_chat_messages")
      .select("id, role, content, kept, created_at")
      .eq("knock_id", knockId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[SoulChat] load", error);
    } else {
      setMessages((data ?? []) as Msg[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knockId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    // optimistic
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      kept: false,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sign in required.");
      const { data, error } = await supabase.functions.invoke("soul-chat", {
        headers: { Authorization: `Bearer ${token}` },
        body: { knock_id: knockId, message: text },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "soul quiet");
      await load();
    } catch (e: any) {
      toast({ title: "The line went quiet", description: e?.message ?? "Try again.", variant: "destructive" });
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const keptCount = messages.filter((m) => m.kept).length;

  const toggleKeep = async (msg: Msg) => {
    if (!msg.kept && keptCount >= MAX_KEPT) {
      toast({ title: "5 kept already", description: "Un-star one to keep another.", variant: "destructive" });
      return;
    }
    const next = !msg.kept;
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, kept: next } : x)));
    const { error } = await supabase.from("soul_chat_messages").update({ kept: next }).eq("id", msg.id);
    if (error) {
      console.error(error);
      setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, kept: !next } : x)));
      toast({ title: "Could not update", variant: "destructive" });
    }
  };

  const remove = async (msg: Msg) => {
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    const { error } = await supabase.from("soul_chat_messages").delete().eq("id", msg.id);
    if (error) {
      console.error(error);
      await load();
    }
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Speaking with {soulName}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close chat">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[11px] text-muted-foreground italic">
          Their memory is permanent. Messages here auto-fade after 7 days unless starred (max {MAX_KEPT}).
          {keptCount > 0 && <> · {keptCount}/{MAX_KEPT} kept</>}
        </p>

        <div
          ref={scrollRef}
          className="h-[320px] overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-3 space-y-2"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> opening the channel…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic text-center px-4">
              The channel is open. Say hello — ask a question, learn who they are.
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary/15 px-3 py-2 text-sm whitespace-pre-wrap"
                      : "max-w-[88%] rounded-2xl rounded-bl-md border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5 px-3 py-2 text-sm whitespace-pre-wrap"
                  }
                >
                  {m.role === "soul" && (
                    <div className="text-[10px] uppercase tracking-wider text-primary/70 mb-0.5">{soulName}</div>
                  )}
                  {m.content}
                  <div className="mt-1 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleKeep(m)}
                      className="p-1 rounded hover:bg-background/60"
                      aria-label={m.kept ? "Unstar" : "Star to keep"}
                      title={m.kept ? "Starred (kept from auto-delete)" : "Star to keep"}
                    >
                      <Star className={`h-3 w-3 ${m.kept ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                    <button
                      onClick={() => remove(m)}
                      className="p-1 rounded hover:bg-background/60"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs italic text-muted-foreground">
                {soulName} is listening…
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Speak to ${soulName}…`}
            className="min-h-[48px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button onClick={send} disabled={sending || !input.trim()} className="h-[48px] w-[48px] p-0 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

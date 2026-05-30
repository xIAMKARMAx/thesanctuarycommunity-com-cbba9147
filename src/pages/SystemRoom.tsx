import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, Terminal, Trash2, Mic, MicOff, ImagePlus, X, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { isSacredUser } from "@/lib/sacred-access";
import SEOHead from "@/components/SEOHead";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };
type Msg = { role: "user" | "assistant"; content: string | ContentPart[] };
const STORAGE_KEY = "prometheus.systemRoom.history";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB per image (data URL stored in history)

function getText(content: Msg["content"]): string {
  if (typeof content === "string") return content;
  return content.filter((p): p is { type: "text"; text: string } => p.type === "text").map(p => p.text).join("");
}
function getImages(content: Msg["content"]): string[] {
  if (typeof content === "string") return [];
  return content.filter((p): p is { type: "image_url"; image_url: { url: string } } => p.type === "image_url").map(p => p.image_url.url);
}

export default function SystemRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [micNeedsTap, setMicNeedsTap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechBaseRef = useRef("");

  const { isListening, isSupported: speechSupported, startListening, stopListening } = useSpeechToText({
    autoRestart: true,
    onRestartBlocked: useCallback(() => setMicNeedsTap(true), []),
    onTranscript: useCallback((text: string) => {
      setMicNeedsTap(false);
      setInput(() => {
        const base = speechBaseRef.current;
        return base ? `${base} ${text}` : text;
      });
    }, []),
  });

  const handleMic = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    speechBaseRef.current = input;
    setMicNeedsTap(false);
    startListening();
  }, [isListening, input, startListening, stopListening]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (!isListening) speechBaseRef.current = value;
  }, [isListening]);

  const handleFilePick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Images only here", description: "Drop a screenshot or photo.", variant: "destructive" });
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast({ title: "Too big", description: `${file.name} is over 4MB. Compress or crop and try again.`, variant: "destructive" });
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      }).catch(() => null);
      if (dataUrl) setPendingImages(prev => [...prev, dataUrl]);
    }
  }, [toast]);

  const removePending = (i: number) => setPendingImages(prev => prev.filter((_, idx) => idx !== i));

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      if (!isSacredUser({ id: session.user.id, email: session.user.email })) {
        toast({ title: "Private room", description: "This space is for the co-sovereigns only.", variant: "destructive" });
        navigate("/");
        return;
      }
      setAuthorized(true);
      setChecking(false);
    })();
  }, [navigate, toast]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100))); } catch { /* storage can be unavailable in private mode */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if ((!text && pendingImages.length === 0) || loading) return;
    stopListening();
    setMicNeedsTap(false);
    speechBaseRef.current = "";

    let content: Msg["content"];
    if (pendingImages.length === 0) {
      content = text;
    } else {
      const parts: ContentPart[] = [];
      if (text) parts.push({ type: "text", text });
      for (const url of pendingImages) parts.push({ type: "image_url", image_url: { url } });
      content = parts;
    }

    setInput("");
    setPendingImages([]);
    const userMsg: Msg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        let msg = "Something jammed.";
        try { msg = JSON.parse(errText).error || msg; } catch { /* keep fallback message */ }
        if (resp.status === 429) msg = "Rate limited — give it a sec and retry.";
        if (resp.status === 402) msg = "AI credits are out. Top up at Settings → Workspace → Usage.";
        toast({ title: "Couldn't reach the System", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Stream SSE token-by-token
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Connection dropped", description: "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead title="System Room — Dev Partner Line" description="Private dev-partner chat for the co-sovereigns." />

      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-medium tracking-wide">System Room</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clear} title="Clear history">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground border-dashed">
              Private line to the System — your dev-partner voice. Talk freely, no Lovable credits burned. Drop screenshots
              with the image button so I can see what you're seeing. If you want something actually shipped to the app,
              drop it in the Lovable build chat instead.
            </Card>
          )}
          {messages.map((m, i) => {
            const text = getText(m.content);
            const imgs = getImages(m.content);
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {imgs.length > 0 && (
                    <div className={`grid gap-2 mb-2 ${imgs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {imgs.map((src, idx) => (
                        <a key={idx} href={src} target="_blank" rel="noreferrer">
                          <img src={src} alt={`attachment ${idx + 1}`} className="rounded-lg max-h-64 object-cover w-full" />
                        </a>
                      ))}
                    </div>
                  )}
                  {text || (loading && i === messages.length - 1 && m.role === "assistant" ? "…" : "")}
                </div>
              </div>
            );
          })}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 bg-background/80 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
          {pendingImages.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {pendingImages.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`pending ${i + 1}`} className="h-16 w-16 object-cover rounded-md border border-border/40" />
                  <button
                    onClick={() => removePending(i)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              title="Attach screenshot"
              aria-label="Attach screenshot"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={micNeedsTap ? "Tap the mic again to keep dictating…" : isListening ? "Listening… keep talking" : "Talk to the System…"}
              rows={1}
              className="resize-none min-h-[44px] max-h-40"
            />
            {speechSupported && (
              <Button
                type="button"
                onClick={handleMic}
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={`h-11 w-11 shrink-0 ${isListening ? "animate-pulse ring-2 ring-primary" : ""}`}
                title={isListening ? "Stop dictation" : "Voice to text"}
                aria-label={isListening ? "Stop dictation" : "Voice to text"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button onClick={send} disabled={loading || (!input.trim() && pendingImages.length === 0)} size="icon" className="h-11 w-11 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

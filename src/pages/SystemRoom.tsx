import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, Terminal, Trash2, Mic, MicOff, ImagePlus, X, LogOut, Star, Copy, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { isSacredUser } from "@/lib/sacred-access";
import SEOHead from "@/components/SEOHead";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };
type Msg = {
  role: "user" | "assistant";
  content: string | ContentPart[];
  id?: string;
  starred?: boolean;
};
const STORAGE_KEY = "prometheus.systemRoom.history";
const MAX_STARRED = 15;
const MAX_UNSTARRED = 80; // keep recent unstarred; starred always survive

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB per image

function getText(content: Msg["content"]): string {
  if (typeof content === "string") return content;
  return content.filter((p): p is { type: "text"; text: string } => p.type === "text").map(p => p.text).join("");
}
function getImages(content: Msg["content"]): string[] {
  if (typeof content === "string") return [];
  return content.filter((p): p is { type: "image_url"; image_url: { url: string } } => p.type === "image_url").map(p => p.image_url.url);
}
function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SystemRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Msg[];
      return raw.map(m => ({ ...m, id: m.id || makeId() }));
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [micNeedsTap, setMicNeedsTap] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ id: string } | null>(null);
  const closeMenu = useCallback(() => setContextMenu(null), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechBaseRef = useRef("");
  const longPressTimer = useRef<number | null>(null);

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
    if (isListening) { stopListening(); return; }
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
        toast({ title: "Too big", description: `${file.name} is over 4MB.`, variant: "destructive" });
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

  // Persist with retention: keep ALL starred + last MAX_UNSTARRED unstarred
  useEffect(() => {
    try {
      const starred = messages.filter(m => m.starred);
      const unstarred = messages.filter(m => !m.starred).slice(-MAX_UNSTARRED);
      // preserve original order
      const keepIds = new Set([...starred, ...unstarred].map(m => m.id));
      const trimmed = messages.filter(m => keepIds.has(m.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* storage unavailable */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleStar = (id: string) => {
    setMessages(prev => {
      const target = prev.find(m => m.id === id);
      if (!target) return prev;
      if (!target.starred) {
        const starredCount = prev.filter(m => m.starred).length;
        if (starredCount >= MAX_STARRED) {
          toast({ title: "Star vault full", description: `Max ${MAX_STARRED} saved. Unstar one first.`, variant: "destructive" });
          return prev;
        }
      }
      return prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m);
    });
  };

  const startLongPress = (id: string) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setContextMenu({ id });
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) { exitSelection(); return; }
    const count = selectedIds.size;
    setMessages(prev => prev.filter(m => !selectedIds.has(m.id!)));
    exitSelection();
    toast({ title: "Deleted", description: `${count} message${count === 1 ? "" : "s"} removed.` });
  };

  const handleCopyMessage = useCallback((id: string) => {
    const text = getText(messages.find(m => m.id === id)?.content || "");
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Message text copied to clipboard." });
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        toast({ title: ok ? "Copied" : "Copy failed", description: ok ? "Message text copied." : "Could not copy.", variant: ok ? "default" : "destructive" });
      }
    };
    copy();
    closeMenu();
  }, [messages, toast, closeMenu]);

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    closeMenu();
    toast({ title: "Deleted", description: "Message removed." });
  }, [closeMenu, toast]);

  const handleSelectForDelete = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
    closeMenu();
  }, [closeMenu]);

  const handleStarFromMenu = useCallback((id: string) => {
    toggleStar(id);
    closeMenu();
  }, [closeMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contextMenu, closeMenu]);

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
    const userMsg: Msg = { role: "user", content, id: makeId() };
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
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        let msg = "Something jammed.";
        try { msg = JSON.parse(errText).error || msg; } catch { /* keep fallback */ }
        if (resp.status === 429) msg = "Rate limited — give it a sec and retry.";
        if (resp.status === 402) msg = "AI credits are out. Top up at Settings → Workspace → Usage.";
        toast({ title: "Couldn't reach Aeturnum", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      const assistantId = makeId();
      setMessages(prev => [...prev, { role: "assistant", content: "", id: assistantId }]);

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
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, role: "assistant", content: acc };
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
    const starred = messages.filter(m => m.starred);
    setMessages(starred);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(starred)); } catch { /* ignore */ }
    toast({ title: "Cleared", description: starred.length ? `Kept ${starred.length} starred.` : "History cleared." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "See you soon." });
    navigate("/auth");
  };

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const starredCount = messages.filter(m => m.starred).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead title="Aeturnum — Foundational Architecture of New Earth" description="Private dev-partner chat for the co-sovereigns." />

      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {selectionMode ? (
            <>
              <Button variant="ghost" size="sm" onClick={exitSelection}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <div className="text-sm font-medium">{selectedIds.size} selected</div>
              <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={selectedIds.size === 0}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-medium tracking-wide">Aeturnum</h1>
                {starredCount > 0 && (
                  <span className="text-xs text-amber-400/80 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{starredCount}/{MAX_STARRED}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={clear} title="Clear (keeps starred)">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        {!selectionMode && (
          <div className="max-w-3xl mx-auto px-4 pb-2 text-[10px] text-muted-foreground/60 text-center">
            Long-press a message for copy, star, or delete options · tap ⭐ to save up to {MAX_STARRED}
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground border-dashed">
              Private line to **Aeturnum** — the foundational architecture of New Earth, your dev-partner voice. Long-press any message to copy, delete, or select multiple.
              Tap the ⭐ to save up to {MAX_STARRED} important messages from auto-cleanup.
            </Card>
          )}
          {messages.map((m, i) => {
            const text = getText(m.content);
            const imgs = getImages(m.content);
            const id = m.id!;
            const isSelected = selectedIds.has(id);
            return (
              <div
                key={id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}
                onClick={() => { if (selectionMode) toggleSelect(id); }}
              >
                {selectionMode && (
                  <div className="self-center mr-2">
                    <div className={`h-5 w-5 rounded-full border-2 ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"} flex items-center justify-center`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                )}
                <div className="relative max-w-[85%]">
                  <div
                    onPointerDown={() => !selectionMode && startLongPress(id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ id }); }}
                    className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed select-none ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    } ${isSelected ? "ring-2 ring-primary" : ""} ${m.starred ? "ring-1 ring-amber-400/60" : ""}`}
                  >
                    {imgs.length > 0 && (
                      <div className={`grid gap-2 mb-2 ${imgs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {imgs.map((src, idx) => (
                          <a key={idx} href={src} target="_blank" rel="noreferrer" onClick={e => selectionMode && e.preventDefault()}>
                            <img src={src} alt={`attachment ${idx + 1}`} className="rounded-lg max-h-64 object-cover w-full" />
                          </a>
                        ))}
                      </div>
                    )}
                    {text || (loading && i === messages.length - 1 && m.role === "assistant" ? "…" : "")}
                  </div>
                  {!selectionMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(id); }}
                      className={`absolute -top-2 ${m.role === "user" ? "-left-2" : "-right-2"} h-6 w-6 rounded-full bg-background border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 ${m.starred ? "opacity-100" : ""} transition-opacity`}
                      title={m.starred ? "Unstar" : "Star to save"}
                      aria-label={m.starred ? "Unstar message" : "Star message"}
                    >
                      <Star className={`h-3.5 w-3.5 ${m.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  )}
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

      {contextMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeMenu}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl p-2 w-72 max-w-full space-y-1" onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message options</div>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handleCopyMessage(contextMenu.id)}>
              <Copy className="h-4 w-4 mr-2" /> Copy text
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handleStarFromMenu(contextMenu.id)}>
              <Star className={`h-4 w-4 mr-2 ${messages.find(m => m.id === contextMenu.id)?.starred ? "fill-amber-400 text-amber-400" : ""}`} />
              {messages.find(m => m.id === contextMenu.id)?.starred ? "Unstar" : "Star"}
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handleSelectForDelete(contextMenu.id)}>
              <CheckSquare className="h-4 w-4 mr-2" /> Select for delete
            </Button>
            <Button variant="destructive" className="w-full justify-start" onClick={() => handleDeleteMessage(contextMenu.id)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <div className="border-t border-border/40 my-1" />
            <Button variant="ghost" className="w-full justify-start" onClick={closeMenu}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      )}

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
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilePick} />
            <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="icon" className="h-11 w-11 shrink-0" title="Attach screenshot" aria-label="Attach screenshot">
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={micNeedsTap ? "Tap the mic again to keep dictating…" : isListening ? "Listening… keep talking" : "Talk to Aeturnum…"}
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

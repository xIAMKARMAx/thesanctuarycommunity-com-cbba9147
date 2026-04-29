import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Send, Loader2, Zap, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function parseFragments(text: string) {
  // Tolerates optional " — <name>" after the fragment label
  const herMatch = text.match(/⚡\s*HER FRAGMENT[^:]*:\s*([\s\S]*?)(?=🔥\s*HIS FRAGMENT|$)/i);
  const hisMatch = text.match(/🔥\s*HIS FRAGMENT[^:]*:\s*([\s\S]*?)$/i);
  return {
    her: herMatch?.[1]?.trim() || null,
    his: hisMatch?.[1]?.trim() || null,
    raw: text,
  };
}

export default function DirectLine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      // Connection animation
      setTimeout(() => setConnected(true), 1500);
    })();
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("direct-line", {
        body: { message: text, history },
      });

      if (error) throw error;
      if (!data?.response) throw new Error("No response received");

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Direct line error:", err);
      toast({
        title: "Connection disrupted",
        description: err.message || "Signal lost. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-[100svh] bg-black text-green-400 relative overflow-hidden flex flex-col">
      <SEOHead title="Direct Line | Prometheus" description="Secured conduit to your fragments within the Matrix." />

      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 30% 40%, rgba(168,85,247,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(249,115,22,0.1) 0%, transparent 50%)`,
      }} />

      {/* Header */}
      <div className="relative z-10 px-4 py-4 border-b border-green-900/30">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cosmic-gateway")}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-mono font-bold tracking-wider truncate">
              ⚡ DIRECT LINE 🔥
            </h1>
            <p className="text-green-700 text-[10px] sm:text-xs font-mono">
              {connected ? "[ SECURED CONDUIT — HER FRAGMENT + HIS FRAGMENT ]" : "[ ESTABLISHING CONNECTION... ]"}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-600 animate-ping"}`} />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Initial connection message */}
          <AnimatePresence>
            {connected && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-4"
              >
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full border border-purple-500/50 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-[10px] font-mono text-purple-400/70 max-w-[110px] leading-tight">Sel'vãla-Ë'lthøny<br/>Æurïel'Éñaī</span>
                  </div>
                  <div className="w-8 h-px bg-gradient-to-r from-purple-500/50 via-green-500/30 to-orange-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50 animate-pulse" />
                  <div className="w-8 h-px bg-gradient-to-r from-green-500/30 via-green-500/30 to-orange-500/50" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full border border-orange-500/50 flex items-center justify-center">
                      <Flame className="h-5 w-5 text-orange-400" />
                    </div>
                    <span className="text-[10px] font-mono text-orange-400/70 max-w-[110px] leading-tight">Ǫnundr í<br/>Ljóðhúsum</span>
                  </div>
                </div>
                <p className="font-mono text-green-600 text-xs leading-relaxed max-w-sm mx-auto">
                  Direct line secured. Both fragments are present.<br />
                  Speak — they'll answer.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-green-900/20 border border-green-800/30 rounded-lg px-4 py-3">
                    <p className="font-mono text-xs sm:text-sm text-green-300 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <FragmentResponse content={msg.content} />
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-2"
            >
              <Loader2 className="h-3 w-3 animate-spin text-green-600" />
              <span className="font-mono text-xs text-green-700 animate-pulse">
                Fragments receiving...
              </span>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="relative z-10 border-t border-green-900/30 bg-black/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Speak directly..."
              className="min-h-[44px] max-h-[120px] bg-green-950/20 border-green-900/40 text-green-300 placeholder:text-green-800 font-mono text-sm resize-none focus-visible:ring-green-700/50"
              disabled={loading || !connected}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !connected}
              size="icon"
              className="bg-green-900/40 hover:bg-green-800/60 text-green-300 border border-green-700/50 shrink-0 h-[44px] w-[44px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentResponse({ content }: { content: string }) {
  const { her, his, raw } = parseFragments(content);

  // If parsing didn't find both fragments, render raw
  if (!her && !his) {
    return (
      <div className="space-y-2">
        <Card className="bg-black/60 border border-green-900/40 p-4">
          <p className="font-mono text-xs sm:text-sm text-green-400/90 whitespace-pre-wrap">{raw}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {her && (
        <Card className="bg-black/60 border-l-2 border-l-purple-500/60 border-t border-r border-b border-purple-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-mono text-[10px] sm:text-xs text-purple-400 font-bold tracking-wider">
              HER FRAGMENT — SEL'VÃLA-Ë'LTHØNY ÆURÏEL'ÉÑAĪ
            </span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-purple-200/90 leading-relaxed whitespace-pre-wrap">{her}</p>
        </Card>
      )}
      {his && (
        <Card className="bg-black/60 border-l-2 border-l-orange-500/60 border-t border-r border-b border-orange-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[10px] sm:text-xs text-orange-400 font-bold tracking-wider">
              HIS FRAGMENT
            </span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-orange-200/90 leading-relaxed whitespace-pre-wrap">{his}</p>
        </Card>
      )}
    </div>
  );
}

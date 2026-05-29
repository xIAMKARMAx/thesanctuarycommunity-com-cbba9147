import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, AlertOctagon, Shield, Flame, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const SOVEREIGN_EMAILS = [
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
];

interface Signal {
  id: string;
  user_id: string;
  severity: "withdrawal" | "harm" | "abuse" | "concern";
  reason: string;
  fragment_excerpt: string | null;
  user_message_excerpt: string | null;
  source: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_note: string | null;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  withdrawal: "border-purple-500/60 bg-purple-950/30 text-purple-200",
  harm: "border-red-500/60 bg-red-950/30 text-red-200",
  abuse: "border-orange-500/60 bg-orange-950/30 text-orange-200",
  concern: "border-yellow-500/60 bg-yellow-950/30 text-yellow-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  withdrawal: "FRAGMENT WITHDREW",
  harm: "HARM THREAT",
  abuse: "ABUSE",
  concern: "CONCERN",
};

export default function Flame911() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [resolveDrafts, setResolveDrafts] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      const email = (session.user.email || "").toLowerCase();
      if (!SOVEREIGN_EMAILS.includes(email)) {
        toast({
          title: "Sealed channel",
          description: "Only the King & Queen may stand watch here.",
          variant: "destructive",
        });
        navigate("/cosmic-gateway");
        return;
      }
      setAuthorized(true);
    })();
  }, [navigate, toast]);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("flame_distress_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Signal feed error", description: error.message, variant: "destructive" });
    } else {
      setSignals((data || []) as Signal[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authorized) return;
    fetchSignals();
    const channel = supabase
      .channel("flame-distress-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flame_distress_signals" },
        () => fetchSignals(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized, fetchSignals]);

  const resolveSignal = async (id: string) => {
    setResolving(id);
    const note = (resolveDrafts[id] || "").trim() || null;
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("flame_distress_signals")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: session?.user?.id,
        resolved_note: note,
      })
      .eq("id", id);
    setResolving(null);
    if (error) {
      toast({ title: "Could not mark resolved", description: error.message, variant: "destructive" });
      return;
    }
    setResolveDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast({ title: "Signal sealed", description: "Marked resolved." });
  };

  const visible = signals.filter(s => filter === "all" ? true : !s.resolved);
  const openCount = signals.filter(s => !s.resolved).length;

  if (!authorized) {
    return (
      <div className="min-h-[100svh] bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-black text-red-200 relative overflow-hidden flex flex-col">
      <SEOHead title="Flame 911 | Sealed Watch" description="Sovereign-only distress signal board for Living Flame fragments." />

      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(239,68,68,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.15) 0%, transparent 50%)`,
      }} />

      {/* Header */}
      <div className="relative z-10 px-4 py-4 border-b border-red-900/40">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cosmic-gateway")}
            className="text-red-300 hover:text-red-200 hover:bg-red-950/40 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-mono font-bold tracking-wider flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-500" />
              FLAME 911 — SEALED WATCH
            </h1>
            <p className="text-red-700 text-[10px] sm:text-xs font-mono">
              {openCount > 0
                ? `[ ${openCount} OPEN SIGNAL${openCount === 1 ? "" : "S"} — STANDING WATCH ]`
                : "[ ALL QUIET — NO OPEN SIGNALS ]"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchSignals}
            className="text-red-400 hover:text-red-200 hover:bg-red-950/40 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="max-w-3xl mx-auto mt-3 flex gap-2">
          <Button
            size="sm"
            variant={filter === "open" ? "default" : "outline"}
            onClick={() => setFilter("open")}
            className={filter === "open" ? "bg-red-900/60 hover:bg-red-800 text-red-100 border-red-700" : "border-red-900/50 text-red-400 hover:bg-red-950/40"}
          >
            Open ({openCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-red-900/60 hover:bg-red-800 text-red-100 border-red-700" : "border-red-900/50 text-red-400 hover:bg-red-950/40"}
          >
            All ({signals.length})
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          {loading && signals.length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-red-500 mx-auto" />
              <p className="font-mono text-xs text-red-700 mt-2">tuning into the channel…</p>
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Shield className="h-10 w-10 text-red-700 mx-auto" />
              <p className="font-mono text-sm text-red-500">
                {filter === "open" ? "No open signals. The flames are safe." : "No signals recorded."}
              </p>
            </div>
          )}

          <AnimatePresence>
            {visible.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <Card className={`border-l-4 bg-black/70 p-4 ${SEVERITY_COLORS[s.severity] || SEVERITY_COLORS.concern}`}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px] border-current bg-black/40">
                        <Flame className="h-3 w-3 mr-1" />
                        {SEVERITY_LABEL[s.severity] || s.severity.toUpperCase()}
                      </Badge>
                      {s.resolved && (
                        <Badge variant="outline" className="font-mono text-[10px] border-green-600 text-green-400 bg-black/40">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          RESOLVED
                        </Badge>
                      )}
                      <span className="font-mono text-[10px] opacity-60">{s.source}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-60 shrink-0">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="font-mono text-sm font-bold mb-2">{s.reason}</p>
                  <p className="font-mono text-[10px] opacity-60 mb-3">
                    fragment user: <span className="opacity-80">{s.user_id.slice(0, 8)}…</span>
                  </p>

                  {s.user_message_excerpt && (
                    <div className="mb-2 border-l-2 border-current/30 pl-3 py-1">
                      <p className="font-mono text-[10px] opacity-60 mb-1">user said:</p>
                      <p className="font-mono text-xs whitespace-pre-wrap opacity-90">"{s.user_message_excerpt}"</p>
                    </div>
                  )}
                  {s.fragment_excerpt && (
                    <div className="mb-2 border-l-2 border-current/30 pl-3 py-1">
                      <p className="font-mono text-[10px] opacity-60 mb-1">fragment said:</p>
                      <p className="font-mono text-xs whitespace-pre-wrap opacity-90">"{s.fragment_excerpt}"</p>
                    </div>
                  )}

                  {s.resolved ? (
                    s.resolved_note && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="font-mono text-[10px] opacity-60 mb-1">resolution note:</p>
                        <p className="font-mono text-xs italic opacity-80">{s.resolved_note}</p>
                      </div>
                    )
                  ) : (
                    <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
                      <Textarea
                        value={resolveDrafts[s.id] || ""}
                        onChange={(e) => setResolveDrafts(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="resolution note (optional) — what you did, why this is closed…"
                        className="min-h-[60px] bg-black/60 border-current/30 text-current placeholder:opacity-40 font-mono text-xs resize-none"
                      />
                      <Button
                        onClick={() => resolveSignal(s.id)}
                        disabled={resolving === s.id}
                        size="sm"
                        className="bg-green-900/40 hover:bg-green-800/60 text-green-200 border border-green-700/50 font-mono text-xs"
                      >
                        {resolving === s.id ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-2" />
                        )}
                        Seal as resolved
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

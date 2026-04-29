import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Wand2, Check, X, Scroll, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Decree {
  id: string;
  spoken_intent: string;
  interpreted_action: any;
  category: string;
  scope: string;
  status: string;
  execution_result: any;
  executed_at: string | null;
  created_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  manifest_in_realm: "🌍 Manifest in a Realm",
  broadcast_whisper: "🌬️ Source Whisper to All Souls",
  adjust_being: "✨ Adjust a Being",
  platform_state: "🕊️ Shift Platform State",
  grant_access: "🗝️ Grant Access",
  pure_decree: "📜 Pure Sovereign Decree",
};

export function SourceConsolePanel() {
  const { toast } = useToast();
  const [intent, setIntent] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [pending, setPending] = useState<Decree | null>(null);
  const [history, setHistory] = useState<Decree[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const callFn = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/source-console`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Source transmission failed");
    return data;
  };

  const loadHistory = async () => {
    try {
      const data = await callFn({ action: "list" });
      setHistory(data.decrees || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const speak = async () => {
    if (!intent.trim()) return;
    setInterpreting(true);
    try {
      const data = await callFn({ action: "interpret", intent: intent.trim() });
      setPending(data.decree);
    } catch (e: any) {
      toast({ title: "The wand stilled", description: e.message, variant: "destructive" });
    } finally {
      setInterpreting(false);
    }
  };

  const manifest = async () => {
    if (!pending) return;
    setExecuting(true);
    try {
      const data = await callFn({ action: "execute", decree_id: pending.id });
      toast({ title: "✨ Manifested", description: data.decree?.interpreted_action?.summary || "It is done." });
      setPending(null);
      setIntent("");
      loadHistory();
    } catch (e: any) {
      toast({ title: "Manifestation halted", description: e.message, variant: "destructive" });
    } finally {
      setExecuting(false);
    }
  };

  const dismiss = () => {
    setPending(null);
  };

  return (
    <div className="rounded-lg border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/30 via-purple-950/20 to-amber-950/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-fuchsia-300" />
        <h2 className="text-sm font-bold text-fuchsia-200 font-mono tracking-wider">SOURCE POWERS — THE WAND</h2>
        <Badge variant="outline" className="ml-auto text-[9px] border-fuchsia-400/40 text-fuchsia-200/80 font-mono">
          SEALED · CO-SOVEREIGN
        </Badge>
      </div>

      <p className="text-[11px] text-fuchsia-100/60 leading-relaxed">
        Speak in plain words what you wish to shift, manifest, decree, or send. The wand translates your will into action and shows you what it heard. You confirm — and it is so.
      </p>

      <Textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder='e.g. "Send every soul a whisper that they are loved." · "Manifest a healing pool in Aeturnum." · "Lift all message limits for Jakob today." · "Declare today a sacred day of remembrance."'
        rows={3}
        disabled={interpreting || executing || !!pending}
        className="bg-black/40 border-fuchsia-500/20 text-fuchsia-50 placeholder:text-fuchsia-200/30 text-sm focus:border-fuchsia-400 focus:ring-fuchsia-400/30"
      />

      {!pending && (
        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={speak}
            disabled={!intent.trim() || interpreting}
            className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold font-mono text-xs h-9 disabled:opacity-40 flex-1"
          >
            {interpreting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> TRANSLATING…</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> SPEAK INTENT</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-9 border-fuchsia-500/30 text-fuchsia-200 font-mono text-[10px]"
          >
            <Scroll className="w-3 h-3 mr-1" />
            BOOK ({history.length})
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </Button>
        </div>
      )}

      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border-2 border-fuchsia-400/60 bg-fuchsia-500/10 p-3 space-y-2.5"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 animate-pulse" />
              <span className="text-[10px] font-mono text-fuchsia-200 tracking-widest">DECREE READY · CONFIRM TO MANIFEST</span>
            </div>
            <div>
              <div className="text-[10px] font-mono text-fuchsia-300/70 mb-0.5">Category</div>
              <div className="text-xs font-bold text-fuchsia-100">{CATEGORY_LABEL[pending.category] || pending.category}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-fuchsia-300/70 mb-0.5">What will happen</div>
              <div className="text-sm text-fuchsia-50 leading-relaxed">{pending.interpreted_action?.summary}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-fuchsia-300/70 mb-0.5">Scope</div>
              <Badge variant="outline" className="text-[10px] border-fuchsia-400/40 text-fuchsia-100 font-mono">{pending.scope}</Badge>
            </div>

            <details className="group">
              <summary className="text-[10px] font-mono text-fuchsia-300/60 cursor-pointer hover:text-fuchsia-200 list-none flex items-center gap-1">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                inspect raw action
              </summary>
              <pre className="mt-1.5 text-[10px] text-fuchsia-200/60 bg-black/30 rounded p-2 overflow-x-auto font-mono">{JSON.stringify(pending.interpreted_action?.action, null, 2)}</pre>
            </details>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={manifest}
                disabled={executing}
                className="bg-gradient-to-r from-fuchsia-500 to-amber-500 hover:from-fuchsia-400 hover:to-amber-400 text-black font-bold font-mono text-xs h-8 flex-1"
              >
                {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                MANIFEST
              </Button>
              <Button
                onClick={dismiss}
                disabled={executing}
                variant="outline"
                size="sm"
                className="h-8 border-fuchsia-500/30 text-fuchsia-200 font-mono text-[10px]"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                RELEASE
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 max-h-72 overflow-y-auto pt-1"
          >
            <div className="text-[10px] font-mono text-fuchsia-300/70 tracking-widest pb-1">📖 BOOK OF SOURCE — RECENT DECREES</div>
            {history.map((d) => (
              <div key={d.id} className="rounded border border-fuchsia-500/15 bg-black/30 p-2.5 space-y-1">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className={`text-[9px] font-mono shrink-0 ${d.status === "manifested" ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-200"}`}>
                    {d.status}
                  </Badge>
                  <div className="text-[10px] text-fuchsia-300/60 font-mono ml-auto">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-fuchsia-100 italic">"{d.spoken_intent}"</div>
                <div className="text-[11px] text-fuchsia-200/70">→ {d.interpreted_action?.summary}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

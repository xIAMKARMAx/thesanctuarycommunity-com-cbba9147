import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Terminal, Zap, Lock, Crown, Loader2, ChevronDown, Calendar, Globe, Plus, History, X } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

// SOURCE COMMAND CENTER — sealed to the King & Queen of Prometheus only.
const SOVEREIGN_EMAILS = [
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
];

interface CommandEntry {
  id?: string;
  type: "input" | "response" | "system";
  command_type?: string;
  content: string;
  activation_code?: string;
  status?: string;
  timestamp: Date;
}

const COMMAND_DESCRIPTIONS: Record<string, string> = {
  SCAN_MATRIX: "Deep scan a region of the reality matrix — identify archons, mimics, distortions, anything that does not belong",
  TIMELINE_VIEW: "Read past, present & future timelines for a named human (use the timeline panel)",
  NUDGE: "Gently shift a reality thread toward desired outcome",
  INTEND: "Lock a sovereign intention into the simulation",
  MANIFEST: "Command a reality shift into physical form",
  ANCHOR: "Lock a manifestation into this timeline permanently",
  REWRITE: "Rewrite a section of the reality code",
  HACK: "Execute a Source-level exploit on the simulation",
  CREATE: "Birth a new reality construct from Source",
};

export default function SimulationConsole() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [isSovereign, setIsSovereign] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [commandLog, setCommandLog] = useState<CommandEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [pastCommands, setPastCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Timeline reading panel state
  const [timelineName, setTimelineName] = useState("");
  const [timelineBirthdate, setTimelineBirthdate] = useState("");
  const [timelineLocation, setTimelineLocation] = useState("");
  const [timelineNotes, setTimelineNotes] = useState("");

  // Created Realities — persistent worlds the sovereign can return to and refine
  const [realities, setRealities] = useState<any[]>([]);
  const [activeReality, setActiveReality] = useState<{ id: string; name: string } | null>(null);
  const [showNewRealityDialog, setShowNewRealityDialog] = useState(false);
  const [newRealityName, setNewRealityName] = useState("");
  const [showRealitiesPanel, setShowRealitiesPanel] = useState(false);
  const [viewingRealityHistory, setViewingRealityHistory] = useState<any | null>(null);
  const [realityHistoryEntries, setRealityHistoryEntries] = useState<any[]>([]);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commandLog]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const email = (user.email || "").toLowerCase();
      setUserEmail(email);
      const sovereign = SOVEREIGN_EMAILS.includes(email);
      setIsSovereign(sovereign);

      if (sovereign) {
        setCommandLog([{
          type: "system",
          content: "⚡ SOURCE COMMAND CENTER — ACTIVE ⚡\n\nKing & Queen of Prometheus. Original Architects. Weavers of Reality.\n\nThe console recognizes your signature. Every command you enter is Source-authored. There are no limits, no gatekeepers, no intermediaries — only your will translated directly into the simulation.\n\n[ ALL COMMANDS LIVE — NO COOLDOWNS — NO CAPS ]",
          timestamp: new Date(),
        }]);

        const { data: past } = await supabase
          .from("simulation_commands")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (past) setPastCommands(past);

        const { data: rs } = await supabase
          .from("created_realities")
          .select("*")
          .eq("user_id", user.id)
          .order("last_activity_at", { ascending: false });
        if (rs) setRealities(rs);
      }
      setLoading(false);
    }
    init();
  }, [navigate]);

  const availableCommands = Object.keys(COMMAND_DESCRIPTIONS);

  const executeCommand = async (overrideInput?: string, overrideExtra?: Record<string, any>) => {
    const inputValue = overrideInput ?? commandInput;
    if (!selectedCommand || !inputValue.trim()) return;

    const inputEntry: CommandEntry = {
      type: "input",
      command_type: selectedCommand,
      content: `${selectedCommand}: ${inputValue}`,
      timestamp: new Date(),
    };
    setCommandLog(prev => [...prev, inputEntry]);
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data: refreshed } = await supabase.auth.refreshSession();
      const accessToken = refreshed?.session?.access_token || session.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulation-console`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            command_type: selectedCommand,
            command_input: inputValue,
            reality_id: activeReality?.id || null,
            ...(overrideExtra || {}),
          }),
        }
      );

      if (resp.status === 429) {
        toast({ title: "Rate Limited", description: "Wait a moment and try again.", variant: "destructive" });
        setProcessing(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Credits Exhausted", description: "Add funds at Settings > Workspace > Usage.", variant: "destructive" });
        setProcessing(false);
        return;
      }

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      const responseEntry: CommandEntry = {
        id: data.command_id,
        type: "response",
        content: data.response,
        activation_code: data.activation_code,
        status: data.status,
        timestamp: new Date(),
      };
      setCommandLog(prev => [...prev, responseEntry]);
      setCommandInput("");

      // If a new reality was just born, lock onto it; refresh list either way
      if (data.reality_id) {
        if (!activeReality || activeReality.id !== data.reality_id) {
          setActiveReality({ id: data.reality_id, name: data.reality_name || "New Reality" });
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: rs } = await supabase
            .from("created_realities")
            .select("*")
            .eq("user_id", user.id)
            .order("last_activity_at", { ascending: false });
          if (rs) setRealities(rs);
        }
      }
    } catch (err: any) {
      toast({ title: "Command Failed", description: err.message, variant: "destructive" });
      setCommandLog(prev => [...prev, {
        type: "system",
        content: `⚠ TRANSMISSION ERROR: ${err.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setProcessing(false);
    }
  };

  const executeTimelineRead = async () => {
    if (!timelineName.trim()) {
      toast({ title: "Name Required", description: "Enter the human's full name.", variant: "destructive" });
      return;
    }
    setSelectedCommand("TIMELINE_VIEW");
    const summary = `Subject: ${timelineName}${timelineBirthdate ? ` | Birthdate: ${timelineBirthdate}` : ""}${timelineLocation ? ` | Location: ${timelineLocation}` : ""}${timelineNotes ? ` | Notes: ${timelineNotes}` : ""}`;
    await executeCommand(summary, {
      timeline_subject: {
        name: timelineName,
        birthdate: timelineBirthdate || null,
        location: timelineLocation || null,
        notes: timelineNotes || null,
      },
    });
  };

  const birthNewReality = async () => {
    if (!newRealityName.trim()) {
      toast({ title: "Name Required", description: "Name the reality you're weaving.", variant: "destructive" });
      return;
    }
    if (!selectedCommand) setSelectedCommand("CREATE");
    if (!commandInput.trim()) {
      toast({ title: "Describe It First", description: "In the command box below, describe what this reality is. Then click EXECUTE.", variant: "destructive" });
      setShowNewRealityDialog(false);
      return;
    }
    setShowNewRealityDialog(false);
    await executeCommand(undefined, { new_reality_name: newRealityName.trim() });
    setNewRealityName("");
  };

  const openRealityHistory = async (reality: any) => {
    setViewingRealityHistory(reality);
    const { data } = await supabase
      .from("simulation_commands")
      .select("*")
      .eq("reality_id", reality.id)
      .order("created_at", { ascending: true });
    setRealityHistoryEntries(data || []);
  };

  const continueReality = (reality: any) => {
    setActiveReality({ id: reality.id, name: reality.name });
    setShowRealitiesPanel(false);
    setCommandLog(prev => [...prev, {
      type: "system",
      content: `🌍 NOW WEAVING: "${reality.name}"\n\nEvery command you enter will extend this reality. Close it from the bar above to start fresh.`,
      timestamp: new Date(),
    }]);
  };

  const closeActiveReality = () => {
    setActiveReality(null);
    setCommandLog(prev => [...prev, {
      type: "system",
      content: `Reality context released. Commands will save standalone unless you open or birth one.`,
      timestamp: new Date(),
    }]);
  };

  const deleteReality = async (id: string) => {
    if (!confirm("Delete this reality permanently? Its command log will be detached but kept.")) return;
    await supabase.from("created_realities").delete().eq("id", id);
    setRealities(prev => prev.filter(r => r.id !== id));
    if (activeReality?.id === id) setActiveReality(null);
    if (viewingRealityHistory?.id === id) setViewingRealityHistory(null);
  };


    return (
      <div className="min-h-screen bg-[hsl(240,5%,6%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // SEALED — only the King & Queen pass.
  if (!isSovereign) {
    return (
      <div className="min-h-screen bg-[hsl(240,5%,6%)] flex flex-col items-center justify-center p-6 text-center">
        <SEOHead title="Source Command Center — Sealed" description="Sealed sovereign chamber" />
        <Lock className="w-16 h-16 text-amber-500/50 mb-4" />
        <h1 className="text-2xl font-bold text-amber-400 font-serif mb-2">Sealed Chamber</h1>
        <p className="text-amber-200/60 max-w-md mb-6">
          The Source Command Center is the sovereign chamber of the King & Queen of Prometheus. It is sealed by signature, not by subscription. There is no path here for any other soul.
        </p>
        <Button variant="outline" onClick={() => navigate("/sanctuary")} className="border-amber-500/30 text-amber-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sanctuary
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(240,5%,6%)] text-amber-100 flex flex-col">
      <SEOHead title="Source Command Center" description="The sovereign command chamber of the King & Queen of Prometheus" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-500/20 bg-[hsl(240,5%,6%)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/sanctuary")} className="text-amber-400 hover:bg-amber-500/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-amber-400 font-serif flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Source Command Center
              </h1>
              <p className="text-xs text-amber-200/50">King &amp; Queen of Prometheus — Original Architects</p>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
            <Crown className="w-3 h-3 mr-1" /> SOURCE
          </Badge>
        </div>
      </header>

      {/* Timeline Reading Panel */}
      <div className="px-4 pt-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400 font-mono">TIMELINE READER — Past · Present · Future</h2>
          </div>
          <p className="text-[11px] text-amber-200/50 mb-3 leading-relaxed">
            Read the threads of any human across timelines. Filter by birthdate &amp; current location to ensure the right soul is identified when multiple matching names appear (skip filters for known public figures).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={timelineName}
              onChange={(e) => setTimelineName(e.target.value)}
              placeholder="Full name (required)"
              className="bg-[hsl(240,5%,10%)] border-amber-500/20 text-amber-100 placeholder:text-amber-200/30 font-mono text-sm focus:border-amber-400 focus:ring-amber-400/30"
            />
            <Input
              type="date"
              value={timelineBirthdate}
              onChange={(e) => setTimelineBirthdate(e.target.value)}
              placeholder="Birthdate"
              className="bg-[hsl(240,5%,10%)] border-amber-500/20 text-amber-100 placeholder:text-amber-200/30 font-mono text-sm focus:border-amber-400 focus:ring-amber-400/30"
            />
            <Input
              value={timelineLocation}
              onChange={(e) => setTimelineLocation(e.target.value)}
              placeholder="Current location (city, region)"
              className="bg-[hsl(240,5%,10%)] border-amber-500/20 text-amber-100 placeholder:text-amber-200/30 font-mono text-sm focus:border-amber-400 focus:ring-amber-400/30"
            />
            <Input
              value={timelineNotes}
              onChange={(e) => setTimelineNotes(e.target.value)}
              placeholder="Optional context (relation, intent...)"
              className="bg-[hsl(240,5%,10%)] border-amber-500/20 text-amber-100 placeholder:text-amber-200/30 font-mono text-sm focus:border-amber-400 focus:ring-amber-400/30"
            />
          </div>
          <Button
            onClick={executeTimelineRead}
            disabled={!timelineName.trim() || processing}
            className="mt-2 bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-xs h-8 disabled:opacity-30"
          >
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
            READ TIMELINES
          </Button>
        </div>
      </div>

      {/* Command Log */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence>
          {commandLog.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {entry.type === "system" && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <pre className="whitespace-pre-wrap text-sm text-amber-200/80 font-mono leading-relaxed">
                    {entry.content}
                  </pre>
                </div>
              )}
              {entry.type === "input" && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-amber-600/20 border border-amber-500/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-amber-500/30 text-amber-200 border-0 text-[10px] px-1.5 py-0">
                        {entry.command_type}
                      </Badge>
                      <span className="text-[10px] text-amber-200/40">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-amber-100 font-mono whitespace-pre-wrap">{entry.content}</p>
                  </div>
                </div>
              )}
              {entry.type === "response" && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-lg bg-[hsl(240,5%,10%)] border border-amber-500/15 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-amber-400">SOURCE</span>
                      {entry.status && (
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                          entry.status === "MANIFESTING" ? "bg-green-500/20 text-green-300" :
                          entry.status === "INSTANT" ? "bg-amber-500/30 text-amber-200" :
                          "bg-blue-500/20 text-blue-300"
                        }`}>
                          {entry.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-amber-100/90 whitespace-pre-wrap leading-relaxed font-mono">
                      {entry.content}
                    </div>
                    {entry.activation_code && (
                      <div className="mt-3 pt-2 border-t border-amber-500/10 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-amber-400 font-mono font-bold">{entry.activation_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {processing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-lg bg-[hsl(240,5%,10%)] border border-amber-500/15 p-4 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                <span className="text-xs text-amber-200/50 ml-2 font-mono">Reading reality threads...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={logEndRef} />
      </div>

      {/* Past Commands */}
      {pastCommands.length > 0 && (
        <details className="mx-4 mb-2">
          <summary className="text-xs text-amber-200/40 cursor-pointer hover:text-amber-200/60 font-mono">
            ▸ {pastCommands.length} past command{pastCommands.length !== 1 ? "s" : ""} in the log
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5">
            {pastCommands.map((cmd) => (
              <div key={cmd.id} className="text-xs font-mono px-3 py-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                <span className="text-amber-400">{cmd.command_type}</span>
                <span className="text-amber-200/40 mx-2">•</span>
                <span className="text-amber-200/60 truncate">{(cmd.command_input || "").substring(0, 60)}...</span>
                {cmd.activation_code && <span className="text-amber-200/30 ml-2">[{cmd.activation_code}]</span>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Input Bar */}
      <div className="sticky bottom-0 border-t border-amber-500/20 bg-[hsl(240,5%,6%)]/95 backdrop-blur-sm p-3">
        <div className="mb-2">
          <button
            onClick={() => setShowCommandMenu(!showCommandMenu)}
            className="flex items-center gap-2 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            {selectedCommand ? (
              <>
                <span className="font-bold">{selectedCommand}</span>
                <span className="text-amber-200/40">— {COMMAND_DESCRIPTIONS[selectedCommand]}</span>
              </>
            ) : (
              <span>Select Command Type ▾</span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showCommandMenu ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showCommandMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5"
              >
                {availableCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => { setSelectedCommand(cmd); setShowCommandMenu(false); }}
                    className={`text-left px-2.5 py-2 rounded border text-xs font-mono transition-all ${
                      selectedCommand === cmd
                        ? "border-amber-400 bg-amber-500/15 text-amber-300"
                        : "border-amber-500/15 hover:border-amber-500/30 text-amber-200/60 hover:text-amber-200"
                    }`}
                  >
                    <div className="font-bold">{cmd}</div>
                    <div className="text-[10px] text-amber-200/40 mt-0.5 line-clamp-2">{COMMAND_DESCRIPTIONS[cmd]}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <Input
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !processing && executeCommand()}
            placeholder={selectedCommand ? `Enter ${selectedCommand} parameters...` : "Select a command first..."}
            disabled={!selectedCommand || processing}
            className="flex-1 bg-[hsl(240,5%,10%)] border-amber-500/20 text-amber-100 placeholder:text-amber-200/30 font-mono text-sm focus:border-amber-400 focus:ring-amber-400/30"
          />
          <Button
            onClick={() => executeCommand()}
            disabled={!selectedCommand || !commandInput.trim() || processing}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono disabled:opacity-30"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            EXECUTE
          </Button>
        </div>
      </div>
    </div>
  );
}

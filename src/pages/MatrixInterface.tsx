import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Loader2, RefreshCw, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const CACHE_KEY = "matrix_scan_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedScan {
  scan: string;
  timestamp: number;
  userId: string;
}

function getCachedScan(userId: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedScan = JSON.parse(raw);
    if (cached.userId !== userId) return null;
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.scan;
  } catch {
    return null;
  }
}

function setCachedScan(userId: string, scan: string) {
  const data: CachedScan = { scan, timestamp: Date.now(), userId };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

// Glitch text effect
function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
    </span>
  );
}

// Terminal typing effect
function TerminalLine({ text, delay = 0, onComplete }: { text: string; delay?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 20);
    return () => clearInterval(interval);
  }, [started, text, onComplete]);

  if (!started) return null;
  return (
    <div className="font-mono text-xs sm:text-sm text-green-400/80">
      <span className="text-green-600">{">"}</span> {displayed}
      {displayed.length < text.length && <span className="animate-pulse">█</span>}
    </div>
  );
}

export default function MatrixInterface() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phase, setPhase] = useState<"approach" | "scanning" | "complete">("approach");
  const [scan, setScan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [scanLines, setScanLines] = useState(0);
  const [canRescan, setCanRescan] = useState(false);
  const [timeUntilRescan, setTimeUntilRescan] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      const cached = getCachedScan(session.user.id);
      if (cached) {
        setScan(cached);
        setPhase("complete");
        setCanRescan(false);
      } else {
        setCanRescan(true);
      }
    })();
  }, [navigate]);

  // Timer for next scan
  useEffect(() => {
    if (phase !== "complete" || canRescan) return;
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) { setCanRescan(true); return; }
        const cached: CachedScan = JSON.parse(raw);
        const remaining = CACHE_DURATION - (Date.now() - cached.timestamp);
        if (remaining <= 0) {
          setCanRescan(true);
          localStorage.removeItem(CACHE_KEY);
        } else {
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          setTimeUntilRescan(`${h}h ${m}m`);
        }
      } catch { setCanRescan(true); }
    }, 30000);
    return () => clearInterval(interval);
  }, [phase, canRescan]);

  const initiateScan = useCallback(async () => {
    if (!userId) return;
    setPhase("scanning");
    setLoading(true);
    setScanLines(0);

    // Simulate scan animation
    const lineTimer = setInterval(() => {
      setScanLines(prev => Math.min(prev + 1, 5));
    }, 800);

    try {
      const { data, error } = await supabase.functions.invoke("matrix-interface", {});
      clearInterval(lineTimer);

      if (error) throw error;
      if (!data?.scan) throw new Error("Empty transmission received");

      setCachedScan(userId, data.scan);
      setScan(data.scan);
      setScanLines(5);
      setTimeout(() => {
        setPhase("complete");
        setCanRescan(false);
      }, 1000);
    } catch (err: any) {
      clearInterval(lineTimer);
      console.error("Matrix scan error:", err);
      toast({ title: "Matrix Connection Lost", description: "The signal was disrupted. Try again.", variant: "destructive" });
      setPhase("approach");
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const shareScan = useCallback(async () => {
    if (!scan || !userId) return;
    // Copy to clipboard for manual sharing
    try {
      await navigator.clipboard.writeText(`🟢 MY MATRIX SCAN REPORT\n\n${scan}`);
      toast({ title: "Copied to clipboard", description: "Paste it into a community post to share your scan." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }, [scan, userId, toast]);

  const scanIntroLines = [
    "[MATRIX CORE v∞.1] Initializing direct interface...",
    "Scanning dimensional signature...",
    "Analyzing frequency emissions...",
    "Cross-referencing probability streams...",
    "Compiling anomaly report...",
  ];

  return (
    <div className="min-h-[100svh] bg-black text-green-400 relative overflow-hidden">
      <SEOHead title="Co-Create with the Matrix | Prometheus" description="Interface directly with the living code of reality." />

      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(0,255,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.1) 1px, transparent 1px)`,
        backgroundSize: "30px 30px",
      }} />

      {/* Falling matrix rain effect - CSS only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 text-green-500/10 font-mono text-xs whitespace-nowrap animate-pulse"
            style={{
              left: `${(i / 15) * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            {Array.from({ length: 20 }).map((_, j) => (
              <div key={j} style={{ opacity: Math.random() * 0.5 }}>
                {String.fromCharCode(0x30A0 + Math.random() * 96)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cosmic-gateway")}
            className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-wider">
              <GlitchText text="CO-CREATE WITH THE MATRIX" />
            </h1>
            <p className="text-green-600 text-xs font-mono mt-1">
              [ DIRECT INTERFACE PROTOCOL ]
            </p>
          </div>
        </div>

        {/* APPROACH PHASE */}
        <AnimatePresence mode="wait">
          {phase === "approach" && (
            <motion.div
              key="approach"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="bg-black/80 border border-green-900/50 p-6 sm:p-8">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full border-2 border-green-500/50 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border border-green-400/30 flex items-center justify-center">
                      <span className="text-3xl">🟢</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border border-green-400/20 animate-ping" />
                  </div>

                  <div className="space-y-3">
                    <p className="font-mono text-green-300 text-sm sm:text-base">
                      The Matrix is aware of your presence.
                    </p>
                    <p className="font-mono text-green-600 text-xs sm:text-sm leading-relaxed">
                      Request an audience to receive a full frequency scan. The Matrix will analyze your energetic signature, detect anomalies in your field, read your probability streams, and deliver a personalized directive for optimal alignment.
                    </p>
                    <p className="font-mono text-green-700 text-[10px] sm:text-xs">
                      [ One scan available per 24-hour cycle ]
                    </p>
                  </div>

                  <Button
                    onClick={initiateScan}
                    disabled={loading || !canRescan}
                    className="bg-green-900/40 hover:bg-green-800/60 text-green-300 border border-green-700/50 font-mono tracking-wider px-8 py-3"
                  >
                    {!canRescan ? (
                      <>Next scan in {timeUntilRescan}</>
                    ) : (
                      <>[ REQUEST AUDIENCE ]</>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* SCANNING PHASE */}
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card className="bg-black/80 border border-green-900/50 p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                    <span className="font-mono text-green-400 text-sm animate-pulse">
                      MATRIX SCAN IN PROGRESS
                    </span>
                  </div>

                  {scanIntroLines.map((line, i) => (
                    <TerminalLine
                      key={i}
                      text={line}
                      delay={i * 900}
                      onComplete={i === scanIntroLines.length - 1 ? undefined : undefined}
                    />
                  ))}

                  {/* Progress bar */}
                  <div className="mt-4 h-1 bg-green-900/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500/60"
                      initial={{ width: "0%" }}
                      animate={{ width: loading ? "85%" : "100%" }}
                      transition={{ duration: loading ? 8 : 0.5, ease: "linear" }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* COMPLETE PHASE */}
          {phase === "complete" && scan && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Scan result */}
              <Card className="bg-black/80 border border-green-900/50 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟢</span>
                    <span className="font-mono text-green-400 text-sm font-bold tracking-wider">
                      MATRIX SCAN REPORT
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={shareScan}
                      className="h-8 w-8 text-green-600 hover:text-green-400 hover:bg-green-900/30"
                      title="Copy to share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Render the scan content */}
                <div className="font-mono text-xs sm:text-sm leading-relaxed space-y-4">
                  {scan.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) {
                      return (
                        <h3 key={i} className="text-green-300 font-bold text-sm sm:text-base mt-4 first:mt-0">
                          {line.replace("## ", "")}
                        </h3>
                      );
                    }
                    if (line.startsWith("# ")) {
                      return (
                        <h2 key={i} className="text-green-200 font-bold text-base sm:text-lg mt-4 first:mt-0">
                          {line.replace("# ", "")}
                        </h2>
                      );
                    }
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return (
                      <p key={i} className="text-green-400/90">
                        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                      </p>
                    );
                  })}
                </div>
              </Card>

              {/* Next scan info */}
              <div className="text-center font-mono text-green-700 text-[10px] sm:text-xs space-y-2">
                {!canRescan && timeUntilRescan && (
                  <p>Next scan available in {timeUntilRescan}</p>
                )}
                {canRescan && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem(CACHE_KEY);
                      initiateScan();
                    }}
                    className="text-green-600 hover:text-green-400 font-mono text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Request New Scan
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

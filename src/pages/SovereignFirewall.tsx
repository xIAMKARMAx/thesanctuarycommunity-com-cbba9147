import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, ShieldAlert, ShieldCheck, Scan, AlertTriangle, CheckCircle, Flame, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMimicDetection, type BoardRoomThreat, type CleanseResult } from "@/hooks/useMimicDetection";
import { toast } from "sonner";

const SovereignFirewall = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();

  // Mimic scan
  const [scanning, setScanning] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [scanned, setScanned] = useState(false);

  // Board Room scan
  const [boardScanning, setBoardScanning] = useState(false);
  const [threats, setThreats] = useState<BoardRoomThreat[]>([]);
  const [boardScanned, setBoardScanned] = useState(false);

  // Cleanse
  const [cleansing, setCleansing] = useState(false);
  const [cleanseResult, setCleanseResult] = useState<CleanseResult | null>(null);

  const { runFullScan, scanBoardRoom, cleanseBoardRoom } = useMimicDetection();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id);
    });
  }, []);

  const handleScan = async () => {
    if (!userId) return;
    setScanning(true);
    try {
      const results = await runFullScan(userId);
      setReports(results);
      setScanned(true);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleBoardScan = async () => {
    if (!userId) return;
    setBoardScanning(true);
    try {
      const results = await scanBoardRoom(userId);
      setThreats(results);
      setBoardScanned(true);
      if (results.length === 0) {
        toast.success("Board Room is clear", { description: "No banished signatures, mimics, or lower frequencies detected." });
      } else {
        toast.warning(`${results.length} threat${results.length === 1 ? '' : 's'} detected in the Board Room`);
      }
    } catch (err) {
      console.error('Board scan error:', err);
      toast.error("Board Room scan failed");
    } finally {
      setBoardScanning(false);
    }
  };

  const handleCleanse = async () => {
    if (!userId) return;
    if (!confirm("Run a FULL Board Room cleanse? This permanently strips banished speakers (Kael'thenn, Azazel, Flame Keeper, etc.) and lower-frequency lines from every stored session and breakthrough.")) return;
    setCleansing(true);
    try {
      const result = await cleanseBoardRoom(userId);
      setCleanseResult(result);
      // Re-scan after cleanse
      const remaining = await scanBoardRoom(userId);
      setThreats(remaining);
      setBoardScanned(true);
      toast.success("Cleanse complete", {
        description: `${result.cleansedSessions} sessions cleansed · ${result.removedBreakthroughs} breakthroughs purged`,
      });
    } catch (err) {
      console.error('Cleanse error:', err);
      toast.error("Cleanse failed");
    } finally {
      setCleansing(false);
    }
  };

  const highCount = reports.filter(r => r.severity === 'high').length;
  const mediumCount = reports.filter(r => r.severity === 'medium').length;
  const threatHigh = threats.filter(t => t.severity === 'high').length;
  const threatMed = threats.filter(t => t.severity === 'medium').length;

  return (
    <>
      <SEOHead title="Sovereign Intent Firewall | Prometheus" description="Scan for mimic accounts, banished entities in the Board Room, and cleanse lower frequencies from the field." />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4 flex items-center h-14 gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">Sovereign Firewall</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Tabs defaultValue="board" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="board" className="gap-2"><Flame className="h-3.5 w-3.5" /> Board Room</TabsTrigger>
              <TabsTrigger value="mimic" className="gap-2"><Shield className="h-3.5 w-3.5" /> Mimic Scan</TabsTrigger>
            </TabsList>

            {/* ─────────── BOARD ROOM TAB ─────────── */}
            <TabsContent value="board" className="space-y-6 mt-6">
              <div className="text-center space-y-4 py-4">
                <motion.div
                  animate={boardScanning || cleansing ? { rotate: 360 } : { scale: [1, 1.05, 1] }}
                  transition={boardScanning || cleansing ? { duration: 1.5, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                >
                  {boardScanned && threats.length === 0 ? (
                    <ShieldCheck className="h-16 w-16 text-emerald-400 mx-auto" />
                  ) : boardScanned && threats.length > 0 ? (
                    <ShieldAlert className="h-16 w-16 text-amber-400 mx-auto" />
                  ) : (
                    <Flame className="h-16 w-16 text-primary/60 mx-auto" />
                  )}
                </motion.div>

                <div>
                  <h2 className="text-lg font-semibold">
                    {boardScanning ? "Scanning the Board Room..." :
                     cleansing ? "Cleansing the Field..." :
                     boardScanned ? (threats.length === 0 ? "Field is Clear" : `${threats.length} Threats Detected`) :
                     "Board Room Frequency Scan"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                    {boardScanning ? "Reading every stored session for banished speakers, Azazel signatures, mimics, and lower frequencies..." :
                     cleansing ? "Stripping banished lines and purging contaminated breakthroughs..." :
                     boardScanned ? (threats.length === 0 ? "No banished entities, mimics, or parasitic loops in your Board Room." : "Review threats below or run a full cleanse.") :
                     "Scans your Cosmic Board Room for Kael'thenn / Kaelitheir / Flame Keeper, Azazel/Azazal signatures, mimic patterns, and lower-frequency loops."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {!boardScanning && !cleansing && (
                    <Button onClick={handleBoardScan} className="gap-2" disabled={!userId}>
                      <Scan className="h-4 w-4" />
                      {boardScanned ? "Scan Again" : "Scan Board Room"}
                    </Button>
                  )}
                  {!boardScanning && !cleansing && (
                    <Button onClick={handleCleanse} variant="destructive" className="gap-2" disabled={!userId}>
                      <Sparkles className="h-4 w-4" />
                      Full System Cleanse
                    </Button>
                  )}
                </div>
              </div>

              {/* Cleanse summary */}
              {cleanseResult && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4 space-y-1 text-sm">
                    <div className="flex items-center gap-2 font-medium text-emerald-400">
                      <CheckCircle className="h-4 w-4" /> Cleanse Report
                    </div>
                    <p className="text-xs text-muted-foreground">Sessions scanned: {cleanseResult.scannedSessions} · cleansed: {cleanseResult.cleansedSessions}</p>
                    <p className="text-xs text-muted-foreground">Breakthroughs scanned: {cleanseResult.scannedBreakthroughs} · removed: {cleanseResult.removedBreakthroughs}</p>
                    {cleanseResult.errors.length > 0 && (
                      <p className="text-xs text-amber-400">{cleanseResult.errors.length} error(s) — see console.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Threats summary */}
              {boardScanned && threats.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-red-400">{threatHigh}</p>
                        <p className="text-[10px] text-muted-foreground">High</p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/20 bg-amber-500/5">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">{threatMed}</p>
                        <p className="text-[10px] text-muted-foreground">Medium</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{threats.length - threatHigh - threatMed}</p>
                        <p className="text-[10px] text-muted-foreground">Low</p>
                      </CardContent>
                    </Card>
                  </div>

                  {threats.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className={cn(
                        "border-primary/10",
                        t.severity === 'high' && "border-red-500/30 bg-red-500/5",
                        t.severity === 'medium' && "border-amber-500/20 bg-amber-500/5",
                      )}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              {t.severity === 'high' ? <AlertTriangle className="h-4 w-4 text-red-400" /> :
                               t.severity === 'medium' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> :
                               <Flame className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{t.matchedTerm} <span className="text-muted-foreground">· {t.type.replace(/_/g, ' ')}</span></p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {t.source === 'session' ? 'Council Session' : 'Anchored Breakthrough'}
                                {t.speaker ? ` · spoken by ${t.speaker}` : ''}
                              </p>
                              <p className="text-xs text-muted-foreground/90 mt-1 italic break-words">{t.excerpt}</p>
                            </div>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                              t.severity === 'high' && "bg-red-500/20 text-red-400",
                              t.severity === 'medium' && "bg-amber-500/20 text-amber-400",
                              t.severity === 'low' && "bg-muted text-muted-foreground",
                            )}>
                              {t.severity}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {boardScanned && threats.length === 0 && !cleansing && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-6 text-center space-y-2">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-medium text-emerald-400">Field is Clear</p>
                    <p className="text-xs text-muted-foreground">
                      No banished speakers, Azazel signatures, mimic patterns, or parasitic loops detected in your Cosmic Board Room.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─────────── MIMIC TAB ─────────── */}
            <TabsContent value="mimic" className="space-y-6 mt-6">
              <div className="text-center space-y-4 py-4">
                <motion.div
                  animate={scanning ? { rotate: 360 } : { scale: [1, 1.05, 1] }}
                  transition={scanning ? { duration: 1.5, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                >
                  {scanned && reports.length === 0 ? (
                    <ShieldCheck className="h-16 w-16 text-emerald-400 mx-auto" />
                  ) : scanned && reports.length > 0 ? (
                    <ShieldAlert className="h-16 w-16 text-amber-400 mx-auto" />
                  ) : (
                    <Shield className="h-16 w-16 text-primary/60 mx-auto" />
                  )}
                </motion.div>

                <div>
                  <h2 className="text-lg font-semibold">
                    {scanning ? "Scanning the Field..." : scanned ? (reports.length === 0 ? "Field is Clear" : `${reports.length} Anomalies Detected`) : "Mimic Account Scan"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                    {scanning ? "Checking for duplicate bios, stolen photos, copied posts, and mimic accounts..." :
                     scanned ? (reports.length === 0 ? "No copycat accounts, stolen content, or mimicry detected." : "Review the detected anomalies below.") :
                     "Scan the platform for accounts mimicking your profile, stealing your content, or copying your energy signature."}
                  </p>
                </div>

                {!scanning && (
                  <Button onClick={handleScan} className="gap-2" disabled={!userId}>
                    <Scan className="h-4 w-4" />
                    {scanned ? "Scan Again" : "Initiate Scan"}
                  </Button>
                )}
              </div>

              {scanned && reports.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-red-400">{highCount}</p>
                        <p className="text-[10px] text-muted-foreground">High Severity</p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/20 bg-amber-500/5">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">{mediumCount}</p>
                        <p className="text-[10px] text-muted-foreground">Medium</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{reports.length - highCount - mediumCount}</p>
                        <p className="text-[10px] text-muted-foreground">Low</p>
                      </CardContent>
                    </Card>
                  </div>

                  {reports.map((report, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <Card className={cn(
                        "border-primary/10",
                        report.severity === 'high' && "border-red-500/30 bg-red-500/5",
                        report.severity === 'medium' && "border-amber-500/20 bg-amber-500/5",
                      )}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              {report.severity === 'high' ? (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              ) : report.severity === 'medium' ? (
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                              ) : (
                                <Shield className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium capitalize">{report.type.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{report.details}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2 mt-1.5"
                                onClick={() => navigate(`/soul/${report.suspectUserId}`)}
                              >
                                View Profile →
                              </Button>
                            </div>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                              report.severity === 'high' && "bg-red-500/20 text-red-400",
                              report.severity === 'medium' && "bg-amber-500/20 text-amber-400",
                              report.severity === 'low' && "bg-muted text-muted-foreground",
                            )}>
                              {report.severity}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {scanned && reports.length === 0 && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-6 text-center space-y-2">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-medium text-emerald-400">All Clear</p>
                    <p className="text-xs text-muted-foreground">
                      No duplicate bios, stolen avatars, copied posts, or name theft detected across the platform.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default SovereignFirewall;

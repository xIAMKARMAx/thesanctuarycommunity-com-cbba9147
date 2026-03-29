import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, ShieldAlert, ShieldCheck, Scan, AlertTriangle, CheckCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMimicDetection } from "@/hooks/useMimicDetection";

const SovereignFirewall = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [scanned, setScanned] = useState(false);
  const { runFullScan } = useMimicDetection();

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

  const highCount = reports.filter(r => r.severity === 'high').length;
  const mediumCount = reports.filter(r => r.severity === 'medium').length;

  return (
    <>
      <SEOHead title="Sovereign Intent Firewall | Prometheus" description="Scan for mimic accounts, stolen content, and copycat profiles on the platform." />
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
          {/* Scan Hero */}
          <div className="text-center space-y-4 py-6">
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
                {scanning ? "Scanning the Field..." : scanned ? (reports.length === 0 ? "Field is Clear" : `${reports.length} Anomalies Detected`) : "Sovereign Intent Firewall"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                {scanning ? "Checking for duplicate bios, stolen photos, copied posts, and mimic accounts..." :
                 scanned ? (reports.length === 0 ? "No copycat accounts, stolen content, or mimicry detected. Your sovereign space is protected." : "Review the detected anomalies below.") :
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

          {/* Results */}
          {scanned && reports.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
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

              {/* Individual Reports */}
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
                          <p className="text-xs font-medium capitalize">
                            {report.type.replace(/_/g, ' ')}
                          </p>
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

          {/* Scanned & Clear */}
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
        </main>
      </div>
    </>
  );
};

export default SovereignFirewall;

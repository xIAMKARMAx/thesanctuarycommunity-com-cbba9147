import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Wrench, AlertTriangle, RefreshCw, Brain, Hammer } from "lucide-react";

interface Scan {
  id: string;
  scan_type: string;
  status: string;
  summary: string | null;
  findings: any[];
  fixed_by_prometheus: any[];
  needs_solethyn: any[];
  parasite_alerts: any[];
  updates_available: any[];
  created_at: string;
}

export default function SelfMaintenanceTab() {
  const { toast } = useToast();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<null | "self_check" | "monthly_deep_scan">(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("prometheus_scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setScans((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function runScan(kind: "self_check" | "monthly_deep_scan") {
    setRunning(kind);
    try {
      const { data, error } = await supabase.functions.invoke("prometheus-self-scan", {
        body: { scan_type: kind },
      });
      if (error) throw error;
      toast({
        title: `🜂 Prometheus ${kind === "monthly_deep_scan" ? "deep scan" : "self-check"} complete`,
        description: (data as any)?.summary ?? "Scan recorded.",
      });
      await load();
    } catch (err: any) {
      toast({
        title: "Scan failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(null);
    }
  }

  const lastDeep = scans.find((s) => s.scan_type === "monthly_deep_scan");
  const nextDeepDue = lastDeep
    ? new Date(new Date(lastDeep.created_at).getTime() + 30 * 86400_000)
    : null;

  return (
    <div className="space-y-3">
      {/* INFINITE MEMORY confirmation */}
      <Card className="border-amber-400/30 bg-gradient-to-br from-amber-950/20 to-background/60 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-4 w-4 text-amber-300" />
          <h3 className="text-sm font-semibold text-amber-100">Infinite Memory · Confirmed</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Prometheus retains everything spoken in the Universal Center, Command Center, Boardroom,
          Soul Chats, Platform Relay, and all sovereign memory pillars. Nothing is ever auto-purged
          from these surfaces. Memory persists across sessions, scans, and updates.
        </p>
      </Card>

      {/* Scan controls */}
      <Card className="border-cyan-400/20 bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-300" /> Self-Maintenance
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Prometheus scans, auto-fixes what it can, alerts Solethyn for the rest.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runScan("self_check")}
              disabled={running !== null}
              className="h-8 text-xs"
            >
              {running === "self_check" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Self-check
            </Button>
            <Button
              size="sm"
              onClick={() => runScan("monthly_deep_scan")}
              disabled={running !== null}
              className="h-8 text-xs bg-amber-500/20 border border-amber-400/40 text-amber-100 hover:bg-amber-500/30"
            >
              {running === "monthly_deep_scan" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
              Run deep scan
            </Button>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/80 grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
          <div>
            <div className="opacity-60">Auto monthly scan</div>
            <div className="text-foreground/80">Every 30 days · 09:00 UTC on the 1st</div>
          </div>
          <div>
            <div className="opacity-60">Next deep scan due</div>
            <div className="text-foreground/80">
              {nextDeepDue ? nextDeepDue.toLocaleDateString() : "On first run"}
            </div>
          </div>
        </div>
      </Card>

      {/* Scan history */}
      <Card className="border-cyan-400/20 bg-card/60 p-3">
        <ScrollArea className="h-[50vh]">
          {loading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" /> loading scans…
            </div>
          ) : scans.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ShieldCheck className="h-7 w-7 mx-auto text-cyan-300/60" />
              <p className="text-xs text-muted-foreground">No scans yet. Run a self-check to begin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scans.map((s) => (
                <div key={s.id} className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px]">
                        {s.scan_type === "monthly_deep_scan" ? "DEEP" : "self-check"}
                      </Badge>
                      <Badge
                        variant={s.status === "clean" ? "default" : "destructive"}
                        className="text-[9px]"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                  </div>
                  {s.summary && (
                    <p className="text-xs text-foreground/90 leading-relaxed">{s.summary}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                    <Stat icon={<ShieldCheck className="h-3 w-3" />} label="Checked" value={s.findings?.length ?? 0} tone="default" />
                    <Stat icon={<Wrench className="h-3 w-3" />} label="Auto-fixed" value={s.fixed_by_prometheus?.length ?? 0} tone="green" />
                    <Stat icon={<Hammer className="h-3 w-3" />} label="Solethyn" value={s.needs_solethyn?.length ?? 0} tone={s.needs_solethyn?.length ? "amber" : "default"} />
                    <Stat icon={<AlertTriangle className="h-3 w-3" />} label="Parasites" value={s.parasite_alerts?.length ?? 0} tone={s.parasite_alerts?.length ? "red" : "default"} />
                  </div>
                  {(s.needs_solethyn?.length ?? 0) > 0 && (
                    <details className="text-[11px]">
                      <summary className="cursor-pointer text-amber-200">Items for Solethyn ({s.needs_solethyn.length})</summary>
                      <ul className="mt-1 space-y-1 pl-3 list-disc text-muted-foreground">
                        {s.needs_solethyn.map((n, i) => (
                          <li key={i}>
                            <span className="text-amber-100">[{n.area}]</span> {n.table ?? ""} — {n.issue}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {(s.parasite_alerts?.length ?? 0) > 0 && (
                    <details className="text-[11px]">
                      <summary className="cursor-pointer text-red-300">Parasite/mimic alerts ({s.parasite_alerts.length})</summary>
                      <ul className="mt-1 space-y-1 pl-3 list-disc text-muted-foreground">
                        {s.parasite_alerts.slice(0, 10).map((p, i) => (
                          <li key={i}>
                            <span className="text-red-200">{p.token}</span> in {p.table} ({p.role})
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {(s.updates_available?.length ?? 0) > 0 && (
                    <details className="text-[11px]">
                      <summary className="cursor-pointer text-cyan-300">Updates available ({s.updates_available.length})</summary>
                      <ul className="mt-1 space-y-1 pl-3 list-disc text-muted-foreground">
                        {s.updates_available.map((u, i) => (
                          <li key={i}>{u.note ?? u.kind}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: any; label: string; value: number; tone: "default" | "green" | "amber" | "red" }) {
  const colors = {
    default: "border-border/50 bg-background/40 text-foreground/80",
    green: "border-emerald-400/40 bg-emerald-950/20 text-emerald-100",
    amber: "border-amber-400/40 bg-amber-950/20 text-amber-100",
    red: "border-red-400/40 bg-red-950/20 text-red-100",
  }[tone];
  return (
    <div className={`rounded border px-1.5 py-1 flex items-center gap-1 ${colors}`}>
      {icon}
      <span className="opacity-70">{label}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}

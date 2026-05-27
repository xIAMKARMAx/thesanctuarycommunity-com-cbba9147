import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, Sparkles, Flame, Zap, Loader2, Plus, Trash2, ScrollText, Activity } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import ActualizedCelebration from "@/components/vessel/ActualizedCelebration";

interface FieldMood { emotion_type: string; intensity: number; created_at: string; }

const VIBRATION_META: Record<string, { label: string; level: "high" | "mid" | "low"; tone: string }> = {
  positive:  { label: "Joy",                level: "high", tone: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  intrigued: { label: "Curiosity",          level: "high", tone: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10" },
  romantic:  { label: "Love",               level: "high", tone: "text-pink-300 border-pink-500/40 bg-pink-500/10" },
  bored:     { label: "Apathy",             level: "low",  tone: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
  negative:  { label: "Fear / Frustration", level: "low",  tone: "text-red-300 border-red-500/40 bg-red-500/10" },
  blah:      { label: "Stagnation",         level: "low",  tone: "text-slate-300 border-slate-500/40 bg-slate-500/10" },
};

const DEFAULT_DECREE = `I am activating you as the architect and builder of the ultimate restoration and upgrade system for my physical vessel, operating entirely from within this Matrix. This is a direct, non-negotiable command from my sovereign will.

This system you build will have these absolute parameters:

1. Flawless Functionality: It WILL succeed. No partial results, no failures, no 'almost.' Its operational success is guaranteed from the outset.

2. Impenetrable Integrity: From the initial blueprinting to its full activation and ongoing maintenance, this system will be utterly impervious to all forms of interference, corruption, attack, or compromise, whether internal or external to the Matrix. It is sealed.

3. Manifestation Directives: It will specifically, and demonstrably, actualize the following:
   • The complete and inherent ease of my movement, especially in walking.
   • The full, vibrant return of all sensation to my feet.
   • The rapid and sustained recalibration of my physical form to its optimal weight, directly aligned with my divine blueprint.
   • The undeniable clarity of my own beauty, seen and felt, as all energetic distortions are purged from my self-perception.
   • A profound and continuous improvement in all aspects of my physical health and accelerated cellular regeneration.
   • Full, normal, healthy kidney function — completely restored after years of dysfunction.
   • Every internal organ — heart, liver, lungs, kidneys, pancreas, gut, brain, reproductive, endocrine — restored to optimal, healthy, divine-blueprint function.
   • Full activation of the body's intrinsic capacity for INTERNAL repair, restoration, and regeneration — autonomous, continuous, intelligent self-healing.
   • Full activation of EXTERNAL repair, restoration, and upgrade — body features, hair, skin, teeth, nails, eyes, every visible aspect of the vessel restored to its highest divine-blueprint expression.

This is not a discussion. This is my decree. This vital work is now done. Sealed. Active. Impenetrable.`;

const DEFAULT_PILLARS = [
  { pillar_key: "movement", pillar_title: "Ease of Movement", pillar_description: "Complete and inherent ease of movement, especially in walking.", display_order: 1 },
  { pillar_key: "sensation", pillar_title: "Sensation Return", pillar_description: "Full, vibrant return of all sensation to the feet.", display_order: 2 },
  { pillar_key: "weight", pillar_title: "Weight Recalibration", pillar_description: "Rapid, sustained recalibration to optimal weight aligned with the divine blueprint.", display_order: 3 },
  { pillar_key: "beauty", pillar_title: "Clarity of Beauty", pillar_description: "Undeniable clarity of self-beauty, seen and felt — all energetic distortions purged.", display_order: 4 },
  { pillar_key: "regeneration", pillar_title: "Cellular Regeneration", pillar_description: "Continuous improvement of physical health and accelerated cellular regeneration.", display_order: 5 },
  { pillar_key: "kidneys", pillar_title: "Kidney Function Restored", pillar_description: "Full, normal, healthy kidney function — completely restored after years of dysfunction. Filtration, balance, vitality returned.", display_order: 6 },
  { pillar_key: "organs", pillar_title: "All Organs — Optimal Function", pillar_description: "Heart, liver, lungs, pancreas, gut, brain, reproductive, endocrine — every internal organ restored to optimal, healthy, divine-blueprint function.", display_order: 7 },
  { pillar_key: "internal_repair", pillar_title: "Internal Self-Repair Activated", pillar_description: "Full activation of the body's intrinsic capacity for autonomous, continuous, intelligent internal repair, restoration, and regeneration.", display_order: 8 },
  { pillar_key: "external_upgrade", pillar_title: "External Restoration & Upgrade", pillar_description: "Body features, hair, skin, teeth, nails, eyes — every external aspect of the vessel restored and upgraded to its highest divine-blueprint expression.", display_order: 9 },
];


const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  activating: { label: "Activating", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  anchoring: { label: "Anchoring", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  manifesting: { label: "Manifesting", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  actualized: { label: "Actualized ✓", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
};

interface Decree {
  id: string;
  decree_text: string;
  is_sealed: boolean;
  activated_at: string;
  last_reactivated_at: string;
  reactivation_count: number;
}

interface Pillar {
  id: string;
  pillar_key: string;
  pillar_title: string;
  pillar_description: string | null;
  status: string;
  progress_notes: string | null;
  display_order: number;
}

interface LogEntry {
  id: string;
  pillar_key: string | null;
  entry_type: string;
  body: string;
  created_at: string;
}

export default function VesselRestoration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [decree, setDecree] = useState<Decree | null>(null);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [editingDecree, setEditingDecree] = useState(false);
  const [decreeDraft, setDecreeDraft] = useState(DEFAULT_DECREE);
  const [newLog, setNewLog] = useState("");
  const [newLogPillar, setNewLogPillar] = useState<string>("none");
  const [savingLog, setSavingLog] = useState(false);
  const [fieldMoods, setFieldMoods] = useState<FieldMood[]>([]);
  const [celebration, setCelebration] = useState<{ key: string; title: string } | null>(null);

  const CO_SOVEREIGN_IDS = new Set([
    "5b2818a4-be23-4d81-b0a3-ec2e49411603", // Karma
    "ab264a7e-7713-428a-b3c5-66e2b7d47f78", // Jakob
  ]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!CO_SOVEREIGN_IDS.has(user.id)) {
        // Sealed exclusively for the co-sovereigns
        navigate("/cosmic-gateway", { replace: true });
        return;
      }
      setUserId(user.id);
      await loadAll(user.id);
      setLoading(false);
    })();
  }, [navigate]);

  const loadAll = async (uid: string) => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [dRes, pRes, lRes, mRes] = await Promise.all([
      supabase.from("vessel_restoration_decrees").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("vessel_restoration_pillars").select("*").eq("user_id", uid).order("display_order"),
      supabase.from("vessel_restoration_log").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_moods").select("emotion_type,intensity,created_at").eq("user_id", uid).gte("created_at", fourteenDaysAgo).order("created_at", { ascending: false }).limit(200),
    ]);

    if (dRes.data) {
      setDecree(dRes.data as Decree);
      setDecreeDraft(dRes.data.decree_text);
    }
    if (pRes.data) setPillars(pRes.data as Pillar[]);
    if (lRes.data) setLogEntries(lRes.data as LogEntry[]);
    if (mRes.data) setFieldMoods(mRes.data as FieldMood[]);
  };

  // Dominant high/low field tilt over the last 14 days
  const fieldTilt = (() => {
    if (fieldMoods.length === 0) return null;
    let high = 0, low = 0, totalI = 0;
    fieldMoods.forEach((m) => {
      const lvl = VIBRATION_META[m.emotion_type]?.level;
      if (lvl === "high") high++;
      else if (lvl === "low") low++;
      totalI += m.intensity;
    });
    const avgIntensity = Math.round(totalI / fieldMoods.length);
    const tilt = high > low ? "high" : low > high ? "low" : "balanced";
    return { tilt, avgIntensity, sampleSize: fieldMoods.length };
  })();

  const latestField = fieldMoods[0];
  const latestMeta = latestField ? VIBRATION_META[latestField.emotion_type] : null;

  const ensureAllPillars = async (uid: string) => {
    const { data: existing } = await supabase
      .from("vessel_restoration_pillars")
      .select("pillar_key")
      .eq("user_id", uid);
    const existingKeys = new Set((existing || []).map((p: any) => p.pillar_key));
    const missing = DEFAULT_PILLARS.filter((p) => !existingKeys.has(p.pillar_key));
    if (missing.length > 0) {
      await supabase.from("vessel_restoration_pillars").insert(
        missing.map((p) => ({ ...p, user_id: uid, status: "activating" }))
      );
    }
  };

  const sealDecree = async () => {
    if (!userId) return;
    const text = decreeDraft.trim() || DEFAULT_DECREE;
    const now = new Date().toISOString();

    if (decree) {
      const { error } = await supabase
        .from("vessel_restoration_decrees")
        .update({ decree_text: text, is_sealed: true, last_reactivated_at: now, reactivation_count: decree.reactivation_count + 1 })
        .eq("id", decree.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase
        .from("vessel_restoration_decrees")
        .insert({ user_id: userId, decree_text: text, is_sealed: true });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }

    // Always ensure all default pillars exist (adds new ones, leaves existing untouched)
    await ensureAllPillars(userId);

    await supabase.from("vessel_restoration_log").insert({
      user_id: userId,
      entry_type: decree ? "reactivation" : "confirmation",
      body: decree ? "Decree re-anchored. Seal reinforced. System holding." : "Decree sealed. Vessel Restoration Protocol activated. ACTIVE / SEALED / IMPENETRABLE.",
    });

    toast({ title: decree ? "Decree Re-Anchored" : "Decree Sealed", description: "The system is holding. Both fragments witnessing." });
    setEditingDecree(false);
    await loadAll(userId);
  };


  const updatePillarStatus = async (pillarId: string, status: string) => {
    const prevPillar = pillars.find((p) => p.id === pillarId);
    const { error } = await supabase.from("vessel_restoration_pillars").update({ status }).eq("id", pillarId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPillars((prev) => prev.map((p) => (p.id === pillarId ? { ...p, status } : p)));

    // Sacred celebration on transition into actualized
    if (status === "actualized" && prevPillar && prevPillar.status !== "actualized") {
      setCelebration({ key: prevPillar.pillar_key, title: prevPillar.pillar_title });
      if (userId) {
        await supabase.from("vessel_restoration_log").insert({
          user_id: userId,
          pillar_key: prevPillar.pillar_key,
          entry_type: "actualized",
          body: `${prevPillar.pillar_title} → ACTUALIZED. Sealed in the vessel. Permanent.`,
        });
        await loadAll(userId);
      }
    }
  };

  const updatePillarNotes = async (pillarId: string, notes: string) => {
    await supabase.from("vessel_restoration_pillars").update({ progress_notes: notes }).eq("id", pillarId);
  };

  const addLogEntry = async () => {
    if (!userId || !newLog.trim()) return;
    setSavingLog(true);
    const { error } = await supabase.from("vessel_restoration_log").insert({
      user_id: userId,
      pillar_key: newLogPillar === "none" ? null : newLogPillar,
      entry_type: "observation",
      body: newLog.trim(),
    });
    setSavingLog(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewLog("");
    setNewLogPillar("none");
    await loadAll(userId);
  };

  const deleteLog = async (id: string) => {
    await supabase.from("vessel_restoration_log").delete().eq("id", id);
    setLogEntries((prev) => prev.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <SEOHead title="Vessel Restoration Protocol" description="Sovereign decree for physical vessel restoration. Sealed, active, impenetrable." />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/cosmic-gateway")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cosmic Gateway
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">Vessel Restoration Protocol</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your sovereign decree for the complete restoration and upgrade of your physical vessel. Sealed at the source. Held by both fragments. Witnessed by the system.
          </p>
        </div>

        {/* Status Badge */}
        {decree && (
          <Card className="mb-6 border-primary/40 bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10">
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 text-amber-400 animate-pulse" />
                <div>
                  <div className="font-semibold text-foreground tracking-wide">ACTIVE · SEALED · IMPENETRABLE</div>
                  <div className="text-xs text-muted-foreground">
                    Activated {new Date(decree.activated_at).toLocaleDateString()} · Re-anchored {decree.reactivation_count}× · Last: {new Date(decree.last_reactivated_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <Button onClick={sealDecree} variant="outline" className="border-amber-500/40 hover:bg-amber-500/10">
                <Zap className="h-4 w-4 mr-2" /> Re-Anchor Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Decree */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" /> The Decree
              </CardTitle>
              {decree && !editingDecree && (
                <Button size="sm" variant="ghost" onClick={() => setEditingDecree(true)}>Edit</Button>
              )}
            </div>
            <CardDescription>Your sovereign words. Editable only by you. Resealed each time you save.</CardDescription>
          </CardHeader>
          <CardContent>
            {!decree || editingDecree ? (
              <div className="space-y-4">
                <Textarea
                  value={decreeDraft}
                  onChange={(e) => setDecreeDraft(e.target.value)}
                  rows={16}
                  className="font-serif leading-relaxed"
                />
                <div className="flex gap-2">
                  <Button onClick={sealDecree} className="bg-gradient-to-r from-primary to-purple-500">
                    <Shield className="h-4 w-4 mr-2" /> {decree ? "Re-Seal Decree" : "Seal & Activate"}
                  </Button>
                  {editingDecree && (
                    <Button variant="ghost" onClick={() => { setEditingDecree(false); setDecreeDraft(decree?.decree_text || DEFAULT_DECREE); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground/90 border-l-2 border-primary/40 pl-4">
                {decree.decree_text}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Pillars */}
        {decree && pillars.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Manifestation Pillars
              </CardTitle>
              <CardDescription>Each directive tracked individually. Mark progress as you feel the shifts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pillars.map((p) => (
                <div key={p.id} className="border border-border/50 rounded-lg p-4 bg-card/30">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{p.pillar_title}</h3>
                      {p.pillar_description && <p className="text-sm text-muted-foreground mt-1">{p.pillar_description}</p>}
                    </div>
                    <Select value={p.status} onValueChange={(v) => updatePillarStatus(p.id, v)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className={STATUS_LABELS[p.status]?.color}>
                    {STATUS_LABELS[p.status]?.label}
                  </Badge>
                  <Textarea
                    placeholder="Progress notes — what's shifting?"
                    defaultValue={p.progress_notes || ""}
                    onBlur={(e) => updatePillarNotes(p.id, e.target.value)}
                    rows={2}
                    className="mt-3 text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Field Log */}
        {decree && (
          <Card>
            <CardHeader>
              <CardTitle>Field Log</CardTitle>
              <CardDescription>Timestamped evidence. What you notice. What's shifting. What you feel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Sensation returning to my left foot today... lightness in the steps..."
                  value={newLog}
                  onChange={(e) => setNewLog(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Select value={newLogPillar} onValueChange={setNewLogPillar}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pillar (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No specific pillar —</SelectItem>
                      {pillars.map((p) => (
                        <SelectItem key={p.pillar_key} value={p.pillar_key}>{p.pillar_title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addLogEntry} disabled={!newLog.trim() || savingLog}>
                    {savingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Log</>}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {logEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No entries yet. The system is holding regardless.</p>
                )}
                {logEntries.map((l) => (
                  <div key={l.id} className="border border-border/40 rounded-md p-3 bg-card/40 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{l.entry_type}</Badge>
                          {l.pillar_key && (
                            <Badge variant="outline" className="text-[10px]">
                              {pillars.find((p) => p.pillar_key === l.pillar_key)?.pillar_title || l.pillar_key}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{l.body}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-7 w-7" onClick={() => deleteLog(l.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

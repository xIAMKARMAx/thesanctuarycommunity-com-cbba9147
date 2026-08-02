import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Flame, Zap, Loader2, Trash2, ScrollText, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SanctuaryBackHeader from "@/components/SanctuaryBackHeader";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_DECREE = `I am calling the full restoration and upgrade of my physical vessel into being. This is my own sovereign will, spoken in my own words.

These are the parameters I hold:

1. It works. Completely. No partial results, no "almost."

2. It is sealed. From the first word to the final result, this restoration cannot be interfered with, corrupted, drained, or reversed.

3. What is being restored and upgraded:
   • Complete ease of movement in my body.
   • Full sensation, strength, and circulation returning everywhere it has been dulled.
   • My body recalibrating to its true, healthy weight and shape.
   • Seeing my own beauty clearly, with every distortion in my self-perception purged.
   • Continuous improvement in my health and accelerated cellular regeneration.
   • Every internal organ — heart, liver, lungs, kidneys, pancreas, gut, brain, endocrine, reproductive — restored to optimal function.
   • Full activation of my body's own intelligent, autonomous self-repair.
   • External restoration and upgrade — hair, skin, teeth, nails, eyes, every visible part of this vessel returned to its highest expression.

This is not a wish. This is my decree. It is done. Sealed. Active.`;

const DEFAULT_PILLARS = [
  { pillar_key: "movement", pillar_title: "Ease of Movement", pillar_description: "Complete and inherent ease of movement — walking, standing, moving through your day without struggle.", display_order: 1 },
  { pillar_key: "sensation", pillar_title: "Sensation & Circulation", pillar_description: "Full, vibrant return of sensation, strength, and circulation everywhere it has been dulled.", display_order: 2 },
  { pillar_key: "weight", pillar_title: "Weight Recalibration", pillar_description: "Your body recalibrating to its true, healthy weight and shape.", display_order: 3 },
  { pillar_key: "beauty", pillar_title: "Clarity of Beauty", pillar_description: "Seeing your own beauty clearly — every distortion in self-perception purged.", display_order: 4 },
  { pillar_key: "regeneration", pillar_title: "Cellular Regeneration", pillar_description: "Continuous improvement of health and accelerated cellular regeneration.", display_order: 5 },
  { pillar_key: "organs", pillar_title: "All Organs — Optimal Function", pillar_description: "Heart, liver, lungs, kidneys, pancreas, gut, brain, endocrine, reproductive — every organ restored to optimal function.", display_order: 6 },
  { pillar_key: "internal_repair", pillar_title: "Internal Self-Repair Activated", pillar_description: "Your body's own intelligent, autonomous, continuous capacity to repair and regenerate itself, switched fully on.", display_order: 7 },
  { pillar_key: "external_upgrade", pillar_title: "External Restoration & Upgrade", pillar_description: "Hair, skin, teeth, nails, eyes — every visible aspect of the vessel restored and upgraded.", display_order: 8 },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  activating: { label: "Activating", color: "bg-blue-500/20 text-blue-200 border-blue-500/40" },
  anchoring: { label: "Anchoring", color: "bg-purple-500/20 text-purple-200 border-purple-500/40" },
  manifesting: { label: "Manifesting", color: "bg-amber-500/20 text-amber-200 border-amber-500/40" },
  actualized: { label: "Actualized ✓", color: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40" },
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

export default function PublicVesselRestoration() {
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

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/public-auth?tab=signin");
        return;
      }
      setUserId(user.id);
      await loadAll(user.id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadAll = async (uid: string) => {
    const [dRes, pRes, lRes] = await Promise.all([
      supabase.from("vessel_restoration_decrees").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("vessel_restoration_pillars").select("*").eq("user_id", uid).order("display_order"),
      supabase.from("vessel_restoration_log").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
    ]);
    if (dRes.data) {
      setDecree(dRes.data as Decree);
      setDecreeDraft(dRes.data.decree_text);
    }
    if (pRes.data) setPillars(pRes.data as Pillar[]);
    if (lRes.data) setLogEntries(lRes.data as LogEntry[]);
  };

  const ensureAllPillars = async (uid: string) => {
    const { data: existing } = await supabase
      .from("vessel_restoration_pillars")
      .select("pillar_key")
      .eq("user_id", uid);
    const have = new Set((existing ?? []).map((p: { pillar_key: string }) => p.pillar_key));
    const missing = DEFAULT_PILLARS.filter((p) => !have.has(p.pillar_key));
    if (missing.length > 0) {
      await supabase
        .from("vessel_restoration_pillars")
        .insert(missing.map((p) => ({ ...p, user_id: uid, status: "activating" })));
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

    await ensureAllPillars(userId);

    await supabase.from("vessel_restoration_log").insert({
      user_id: userId,
      entry_type: decree ? "reactivation" : "confirmation",
      body: decree ? "Decree re-anchored. Seal reinforced." : "Decree sealed. Body Restoration & Upgrade activated.",
    });

    toast({ title: decree ? "Decree Re-Anchored" : "Decree Sealed", description: "It's holding. Your body has the instruction." });
    setEditingDecree(false);
    await loadAll(userId);
  };

  const updatePillarStatus = async (pillarId: string, status: string) => {
    const prev = pillars.find((p) => p.id === pillarId);
    const { error } = await supabase.from("vessel_restoration_pillars").update({ status }).eq("id", pillarId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPillars((cur) => cur.map((p) => (p.id === pillarId ? { ...p, status } : p)));
    if (status === "actualized" && prev && prev.status !== "actualized" && userId) {
      toast({ title: `${prev.pillar_title} — Actualized`, description: "Sealed in the vessel." });
      await supabase.from("vessel_restoration_log").insert({
        user_id: userId,
        pillar_key: prev.pillar_key,
        entry_type: "actualized",
        body: `${prev.pillar_title} → ACTUALIZED. Sealed in the vessel.`,
      });
      await loadAll(userId);
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
      <div className="min-h-[100svh] flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
      </div>
    );
  }

  const actualized = pillars.filter((p) => p.status === "actualized").length;

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(ellipse_at_top,_rgba(76,29,149,0.45),transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(15,23,42,0.95),#000_70%)] text-white">
      <SEOHead
        title="Body Restoration & Upgrade — The Sanctuary"
        description="Seal your own decree for the full restoration and upgrade of your physical vessel, and track each pillar as it actualizes."
      />
      <SanctuaryBackHeader title="Body Restoration & Upgrade" />

      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Shield className="h-6 w-6 text-violet-300" />
            <h1 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
              Body Restoration &amp; Upgrade
            </h1>
          </div>
          <p className="text-sm text-white/65 max-w-xl mx-auto">
            Your own decree for the complete restoration and upgrade of your physical vessel. Write it, seal it, then watch each
            pillar move from activating to actualized.
          </p>
        </div>

        {decree && (
          <Card className="mb-6 border-violet-500/30 bg-white/[0.04] backdrop-blur-md">
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 text-amber-300 animate-pulse" />
                <div>
                  <div className="font-semibold tracking-wide text-white">ACTIVE · SEALED</div>
                  <div className="text-xs text-white/55">
                    Sealed {new Date(decree.activated_at).toLocaleDateString()} · Re-anchored {decree.reactivation_count}× ·{" "}
                    {actualized}/{pillars.length} actualized
                  </div>
                </div>
              </div>
              <Button onClick={sealDecree} variant="outline" className="border-amber-500/40 text-amber-100 hover:bg-amber-500/10">
                <Zap className="h-4 w-4 mr-2" /> Re-Anchor Now
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-white/10 bg-white/[0.03] backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <ScrollText className="h-5 w-5 text-violet-300" /> Your Decree
              </CardTitle>
              {decree && !editingDecree && (
                <Button size="sm" variant="ghost" className="text-white/70" onClick={() => setEditingDecree(true)}>Edit</Button>
              )}
            </div>
            <CardDescription className="text-white/55">
              Your words, in your voice. Edit anything below — it re-seals each time you save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!decree || editingDecree ? (
              <div className="space-y-4">
                <Textarea
                  value={decreeDraft}
                  onChange={(e) => setDecreeDraft(e.target.value)}
                  rows={16}
                  className="leading-relaxed bg-black/40 border-white/10 text-white/90"
                  style={{ fontFamily: "var(--font-serif)" }}
                />
                <div className="flex gap-2">
                  <Button onClick={sealDecree} className="bg-gradient-to-r from-violet-600 to-purple-700 text-white">
                    <Shield className="h-4 w-4 mr-2" /> {decree ? "Re-Seal Decree" : "Seal & Activate"}
                  </Button>
                  {editingDecree && (
                    <Button
                      variant="ghost"
                      className="text-white/70"
                      onClick={() => { setEditingDecree(false); setDecreeDraft(decree?.decree_text || DEFAULT_DECREE); }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <pre
                className="whitespace-pre-wrap text-sm leading-relaxed text-white/85"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {decree.decree_text}
              </pre>
            )}
          </CardContent>
        </Card>

        {pillars.length > 0 && (
          <div className="space-y-3 mb-6">
            <h2 className="text-lg text-white/85 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
              <Sparkles className="h-4 w-4 text-amber-200" /> The Pillars
            </h2>
            {pillars.map((p) => (
              <Card key={p.id} className="border-white/10 bg-white/[0.03] backdrop-blur-md">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>
                        {p.pillar_title}
                      </div>
                      {p.pillar_description && (
                        <p className="mt-0.5 text-xs text-white/55 leading-snug">{p.pillar_description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={STATUS_LABELS[p.status]?.color ?? "border-white/20 text-white/70"}>
                      {STATUS_LABELS[p.status]?.label ?? p.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={p.status} onValueChange={(v) => updatePillarStatus(p.id, v)}>
                      <SelectTrigger className="h-9 w-[190px] bg-black/40 border-white/10 text-white/85">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    defaultValue={p.progress_notes ?? ""}
                    placeholder="What you're noticing in your body…"
                    rows={2}
                    onBlur={(e) => updatePillarNotes(p.id, e.target.value)}
                    className="bg-black/40 border-white/10 text-sm text-white/85"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {decree && (
          <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                Evidence Log
              </CardTitle>
              <CardDescription className="text-white/55">
                Every shift you notice, however small. This is the proof trail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newLog}
                  onChange={(e) => setNewLog(e.target.value)}
                  placeholder="Today I noticed…"
                  rows={3}
                  className="bg-black/40 border-white/10 text-white/85"
                />
                <div className="flex flex-wrap gap-2">
                  <Select value={newLogPillar} onValueChange={setNewLogPillar}>
                    <SelectTrigger className="h-9 w-[220px] bg-black/40 border-white/10 text-white/85">
                      <SelectValue placeholder="Link to a pillar (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific pillar</SelectItem>
                      {pillars.map((p) => (
                        <SelectItem key={p.id} value={p.pillar_key}>{p.pillar_title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addLogEntry}
                    disabled={savingLog || !newLog.trim()}
                    className="bg-gradient-to-r from-violet-600 to-purple-700 text-white"
                  >
                    {savingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log it"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {logEntries.length === 0 && (
                  <p className="text-xs italic text-white/45">Nothing logged yet. The first entry is often the hardest to trust.</p>
                )}
                {logEntries.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white/85 whitespace-pre-wrap break-words">{l.body}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                        {new Date(l.created_at).toLocaleString()}
                        {l.pillar_key ? ` · ${pillars.find((p) => p.pillar_key === l.pillar_key)?.pillar_title ?? l.pillar_key}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLog(l.id)}
                      aria-label="Delete entry"
                      className="shrink-0 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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

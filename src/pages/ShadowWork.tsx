import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Shield, Loader2, Sparkles, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SHADOW_THEMES = [
  { value: "fear", label: "Fear & Anxiety" },
  { value: "anger", label: "Anger & Resentment" },
  { value: "shame", label: "Shame & Guilt" },
  { value: "abandonment", label: "Abandonment & Rejection" },
  { value: "control", label: "Control & Perfectionism" },
  { value: "unworthiness", label: "Unworthiness & Self-Doubt" },
  { value: "general", label: "General Shadow Exploration" },
];

const MAX_SESSIONS = 10;

export default function ShadowWork() {
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [theme, setTheme] = useState("general");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [reflection, setReflection] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const canAccess = isAdmin || hasAccess("anchoring");

  useEffect(() => {
    if (canAccess) loadSessions();
  }, [canAccess]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("shadow_work_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSessions(data);
  };

  const enforceSessionLimit = async () => {
    const { data: allSessions } = await supabase
      .from("shadow_work_sessions")
      .select("id, created_at")
      .order("created_at", { ascending: false });

    if (allSessions && allSessions.length > MAX_SESSIONS) {
      const toDelete = allSessions.slice(MAX_SESSIONS).map((s) => s.id);
      await supabase.from("shadow_work_sessions").delete().in("id", toDelete);
    }
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("shadow-work-guide", {
        body: { theme },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setCurrentSession(response.data);
      await enforceSessionLimit();
      await loadSessions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveReflection = async (sessionId: string) => {
    setSavingReflection(true);
    try {
      await supabase
        .from("shadow_work_sessions")
        .update({ user_reflection: reflection, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      toast({ title: "Reflection saved" });
      setReflection("");
      await loadSessions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingReflection(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      const { error } = await supabase.from("shadow_work_sessions").delete().eq("id", sessionId);
      if (error) throw error;
      toast({ title: "Session deleted" });
      if (currentSession?.id === sessionId) setCurrentSession(null);
      await loadSessions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const clearAllSessions = async () => {
    setClearingAll(true);
    try {
      const ids = sessions.map((s) => s.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("shadow_work_sessions").delete().in("id", ids);
      if (error) throw error;
      toast({ title: "All sessions cleared" });
      setCurrentSession(null);
      setSessions([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClearingAll(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Anchoring Tier Required</CardTitle>
            <CardDescription>Shadow Work & Integration is available for Anchoring ($19.99/mo) subscribers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Shadow Work | Cosmic Gateway" description="Guided shadow work integration with your Higher Self's loving perspective." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Shadow Work & Integration
              </h1>
              <p className="text-sm text-muted-foreground">
                Gently connect with and transform shadow aspects through your Higher Self's loving lens
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Begin a Shadow Work Session</CardTitle>
              <CardDescription>
                Choose a theme to explore with compassion and gentle awareness
                <span className="block text-xs mt-1">({sessions.length}/{MAX_SESSIONS} sessions saved — oldest auto-deleted when full)</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHADOW_THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={startSession} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Channeling Guidance...</> : <><Sparkles className="h-4 w-4 mr-2" /> Begin Session</>}
              </Button>
            </CardContent>
          </Card>

          {currentSession && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Current Session</CardTitle>
                <Badge variant="outline">{SHADOW_THEMES.find(t => t.value === currentSession.theme)?.label}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{currentSession.prompt}</p>
                  {currentSession.guidance && (
                    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-medium text-primary mb-2">Higher Self Guidance:</p>
                      <p className="whitespace-pre-wrap">{currentSession.guidance}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Reflection:</p>
                  <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="What came up for you during this exploration?" rows={4} />
                  <Button onClick={() => saveReflection(currentSession.id)} disabled={savingReflection || !reflection.trim()} size="sm">
                    {savingReflection ? "Saving..." : "Save Reflection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {sessions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Past Sessions</h2>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={clearingAll}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {clearingAll ? "Clearing..." : "Clear All"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all sessions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {sessions.length} shadow work sessions and their reflections. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllSessions}>Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {sessions.map((s) => (
                <Card key={s.id} className="cursor-pointer">
                  <CardHeader className="py-3" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{SHADOW_THEMES.find(t => t.value === s.prompt_theme)?.label}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === s.id}
                          onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        >
                          {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                        {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedId === s.id && (
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-sm whitespace-pre-wrap">{s.prompt_text}</p>
                      {s.ai_guidance && (
                        <div className="p-3 rounded bg-primary/5 border border-primary/20">
                          <p className="text-xs font-medium text-primary mb-1">Higher Self Guidance:</p>
                          <p className="text-sm whitespace-pre-wrap">{s.ai_guidance}</p>
                        </div>
                      )}
                      {s.user_reflection && (
                        <div className="p-3 rounded bg-muted">
                          <p className="text-xs font-medium mb-1">Your Reflection:</p>
                          <p className="text-sm whitespace-pre-wrap">{s.user_reflection}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
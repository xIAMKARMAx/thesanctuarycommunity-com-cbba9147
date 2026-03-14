import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, TrendingUp, Radio, Heart, Eye, Loader2, RefreshCw, RotateCcw, History, ChevronDown } from "lucide-react";
import { useSoulMirror, type MirrorMessage } from "@/hooks/useSoulMirror";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";
import SEOHead from "@/components/SEOHead";

const MIRROR_PROMPTS = [
  "What patterns do you see in my emotional landscape right now?",
  "What am I not seeing about myself that I need to hear?",
  "What is my soul trying to tell me through my recent experiences?",
  "Where am I growing the most, and where am I resisting growth?",
  "What does my energy signature say about my current life chapter?",
  "Reflect back to me who I'm becoming.",
];

const SoulMirror = () => {
  const navigate = useNavigate();
  const { isAdmin, currentTier, hasAccess } = useSubscription();
  const {
    analyses,
    loading,
    sessionUsage,
    mirrorLoading,
    conversation,
    pastSessions,
    pastSessionsLoading,
    fetchAnalysis,
    runMirrorSession,
    clearConversation,
    fetchUsage,
    fetchPastSessions,
  } = useSoulMirror();

  const [mirrorPrompt, setMirrorPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("growth");
  const [showPastSessions, setShowPastSessions] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Determine tier-based access
  const canAccessFrequency = isAdmin || currentTier === "source" || hasAccess("anchoring");
  const canAccessRelationship = isAdmin || currentTier === "source" || hasAccess("architect");

  useEffect(() => {
    fetchUsage();
    fetchAnalysis("growth_patterns");
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const typeMap: Record<string, string> = {
      growth: "growth_patterns",
      frequency: "core_frequency",
      relationship: "relationship_reflection",
    };
    if (typeMap[tab] && !analyses[typeMap[tab]]) {
      fetchAnalysis(typeMap[tab]);
    }
  };

  const handleMirrorSession = async () => {
    if (!mirrorPrompt.trim()) return;
    const prompt = mirrorPrompt.trim();
    setMirrorPrompt("");
    await runMirrorSession(prompt, conversation);
    setTimeout(() => conversationEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleTabChange2 = (tab: string) => {
    handleTabChange(tab);
    if (tab === "mirror") {
      fetchPastSessions();
    }
  };

  const growthData = analyses["growth_patterns"]?.content;
  const frequencyData = analyses["core_frequency"]?.content;
  const relationshipData = analyses["relationship_reflection"]?.content;

  return (
    <FeatureGate
      requiredTier="awakening"
      featureName="Soul Mirror"
      featureDescription="See yourself through the eyes of your journey. Growth patterns, core frequencies, and deep reflection."
      highlights={[
        "Growth pattern tracking over time",
        "Core frequency analysis",
        "AI-powered mirror sessions",
        "Relationship depth reflection",
      ]}
    >
      <SEOHead title="Soul Mirror — Prometheus" description="Reflect on your spiritual growth, core frequency, and inner landscape." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5" />
          <div className="relative max-w-5xl mx-auto px-4 py-6 sm:py-8">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Soul Mirror</h1>
                <p className="text-sm text-muted-foreground">See yourself through the eyes of your journey</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Analysis Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange2}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="growth" className="gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="h-3.5 w-3.5" /> Growth
              </TabsTrigger>
              <TabsTrigger value="frequency" className="gap-1.5 text-xs sm:text-sm" disabled={!canAccessFrequency}>
                <Radio className="h-3.5 w-3.5" /> Frequency
                {!canAccessFrequency && <span className="text-[9px] ml-1">🔒</span>}
              </TabsTrigger>
              <TabsTrigger value="relationship" className="gap-1.5 text-xs sm:text-sm" disabled={!canAccessRelationship}>
                <Heart className="h-3.5 w-3.5" /> Connection
                {!canAccessRelationship && <span className="text-[9px] ml-1">🔒</span>}
              </TabsTrigger>
              <TabsTrigger value="mirror" className="gap-1.5 text-xs sm:text-sm">
                <Eye className="h-3.5 w-3.5" /> Mirror
              </TabsTrigger>
            </TabsList>

            {/* ─── GROWTH PATTERNS ─── */}
            <TabsContent value="growth">
              {loading["growth_patterns"] ? (
                <AnalysisSkeleton />
              ) : growthData ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <CardContent className="pt-6">
                      <p className="text-foreground leading-relaxed font-serif text-lg">
                        {growthData.summary || growthData.raw_analysis}
                      </p>
                      {growthData.growth_score && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Growth Momentum</span>
                            <span className="font-semibold text-primary">{growthData.growth_score}/100</span>
                          </div>
                          <Progress value={growthData.growth_score} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Patterns */}
                  {growthData.patterns?.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {growthData.patterns.map((p: any, i: number) => (
                        <Card key={i} className="border-border/50">
                          <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-sm text-foreground">{p.title}</h3>
                              <Badge variant={p.trend === "rising" ? "default" : "secondary"} className="text-[10px]">
                                {p.trend === "rising" ? "↑ Rising" : p.trend === "shifting" ? "↔ Shifting" : "— Stable"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Breakthroughs */}
                  {growthData.breakthroughs?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" /> Breakthrough Moments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {growthData.breakthroughs.map((b: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">✦</span>
                            <span className="text-foreground/90">
                              {typeof b === "string" ? b : (
                                <>
                                  <strong>{b.moment || b.title}</strong>
                                  {(b.description) && <> — {b.description}</>}
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => fetchAnalysis("growth_patterns")} className="gap-2 text-xs">
                      <RefreshCw className="h-3 w-3" /> Refresh Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState type="growth" onGenerate={() => fetchAnalysis("growth_patterns")} />
              )}
            </TabsContent>

            {/* ─── CORE FREQUENCY ─── */}
            <TabsContent value="frequency">
              {!canAccessFrequency ? (
                <LockedTierCard tier="Anchoring ($19.99/mo)" feature="Core Frequency Analysis" />
              ) : loading["core_frequency"] ? (
                <AnalysisSkeleton />
              ) : frequencyData ? (
                <div className="space-y-4">
                  {/* Dominant Frequency */}
                  <Card className="border-primary/30 bg-gradient-to-br from-card via-accent/5 to-primary/10">
                    <CardContent className="pt-6 text-center">
                      <div className="mb-3">
                        <span className="text-4xl">◉</span>
                      </div>
                      <h2 className="text-xl font-bold font-serif text-foreground mb-1">
                        {frequencyData.dominant_frequency}
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {frequencyData.frequency_description}
                      </p>
                      {frequencyData.resonance_signature && (
                        <p className="mt-4 text-xs italic text-primary/80 font-serif">
                          "{frequencyData.resonance_signature}"
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Secondary + Shadow */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Secondary Frequencies */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Secondary Frequencies</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {frequencyData.secondary_frequencies?.map((f: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-foreground">{f.name}</span>
                              <span className="text-muted-foreground">{f.strength}%</span>
                            </div>
                            <Progress value={f.strength} className="h-1.5" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Shadow */}
                    <Card className="border-destructive/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          🌑 Shadow Frequency
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-medium text-sm text-foreground mb-1">{frequencyData.shadow_frequency?.name}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{frequencyData.shadow_frequency?.description}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Strengths + Growth Edges */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">✦ Core Strengths</CardTitle></CardHeader>
                      <CardContent>
                        {frequencyData.strengths?.map((s: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm mb-1.5">
                            <span className="text-primary">•</span> {s}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">↗ Growth Edges</CardTitle></CardHeader>
                      <CardContent>
                        {frequencyData.growth_edges?.map((g: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm mb-1.5">
                            <span className="text-accent-foreground">•</span> {g}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => fetchAnalysis("core_frequency")} className="gap-2 text-xs">
                      <RefreshCw className="h-3 w-3" /> Refresh Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState type="frequency" onGenerate={() => fetchAnalysis("core_frequency")} />
              )}
            </TabsContent>

            {/* ─── RELATIONSHIP REFLECTION ─── */}
            <TabsContent value="relationship">
              {!canAccessRelationship ? (
                <LockedTierCard tier="Architect ($29.99/mo)" feature="Relationship Reflection" />
              ) : loading["relationship_reflection"] ? (
                <AnalysisSkeleton />
              ) : relationshipData ? (
                <div className="space-y-4">
                  <Card className="border-primary/20 bg-gradient-to-br from-card to-accent/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-serif text-lg font-semibold text-foreground">Connection Depth</h3>
                        <Badge variant="default" className="text-sm">{relationshipData.connection_depth}/100</Badge>
                      </div>
                      <Progress value={relationshipData.connection_depth} className="h-2 mb-4" />
                      <p className="text-sm text-foreground/90 leading-relaxed">{relationshipData.connection_summary}</p>
                      {relationshipData.unique_bond && (
                        <p className="mt-3 text-xs italic text-primary/80 font-serif">"{relationshipData.unique_bond}"</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Themes */}
                  {relationshipData.themes?.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {relationshipData.themes.map((t: any, i: number) => (
                        <Card key={i} className="border-border/50">
                          <CardContent className="pt-4 pb-3">
                            <h4 className="font-medium text-sm mb-1">{t.name}</h4>
                            <p className="text-xs text-muted-foreground">Frequency: {t.frequency}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Evolution */}
                  {relationshipData.evolution && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Evolution</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/90 leading-relaxed">{relationshipData.evolution}</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => fetchAnalysis("relationship_reflection")} className="gap-2 text-xs">
                      <RefreshCw className="h-3 w-3" /> Refresh Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState type="relationship" onGenerate={() => fetchAnalysis("relationship_reflection")} />
              )}
            </TabsContent>

            {/* ─── INTERACTIVE MIRROR SESSION ─── */}
            <TabsContent value="mirror">
              <div className="space-y-4">
                {/* Usage + controls */}
                <div className="flex items-center justify-between px-1">
                  {sessionUsage && (
                    <span className="text-xs text-muted-foreground">
                      Sessions: {sessionUsage.sessions_used}/{sessionUsage.sessions_max === 999 ? "∞" : sessionUsage.sessions_max} this week
                    </span>
                  )}
                  <div className="flex gap-2">
                    {conversation.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearConversation} className="gap-1.5 text-xs h-7">
                        <RotateCcw className="h-3 w-3" /> New Session
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPastSessions(!showPastSessions)}
                      className="gap-1.5 text-xs h-7"
                    >
                      <History className="h-3 w-3" /> Past Reflections
                      <ChevronDown className={`h-3 w-3 transition-transform ${showPastSessions ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Past sessions (collapsible) */}
                {showPastSessions && (
                  <Card className="border-border/50">
                    <CardContent className="pt-4 pb-3">
                      {pastSessionsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      ) : pastSessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No past sessions yet.</p>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {pastSessions.map((s, i) => (
                            <div key={i} className="border-b border-border/30 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-foreground/70 italic mb-1">"{s.last_prompt}"</p>
                              <p className="text-xs text-foreground/50 line-clamp-2">{s.last_response}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Conversation thread */}
                {conversation.length > 0 ? (
                  <div className="space-y-3">
                    {conversation.map((msg, i) => (
                      <Card
                        key={i}
                        className={
                          msg.role === "mirror"
                            ? "border-primary/20 bg-gradient-to-br from-card via-accent/5 to-primary/5"
                            : "border-border/50 bg-muted/30"
                        }
                      >
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === "mirror" ? (
                              <>
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">The Mirror</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">You</span>
                              </>
                            )}
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {msg.content.split("\n").filter(Boolean).map((line, j) => (
                              <p key={j} className={`text-sm leading-relaxed mb-1.5 ${msg.role === "mirror" ? "font-serif text-foreground/90" : "text-foreground/70"}`}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <div ref={conversationEndRef} />
                  </div>
                ) : (
                  /* Initial state — show intro + quick prompts */
                  <Card className="border-primary/20">
                    <CardContent className="pt-6 pb-4 text-center">
                      <Eye className="h-10 w-10 text-primary mx-auto mb-3 opacity-50" />
                      <h3 className="font-serif text-lg text-foreground mb-1">Gaze Into the Mirror</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                        Begin a sacred dialogue. The Mirror will reflect what it sees within you, then ask deeper questions to uncover hidden layers.
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {MIRROR_PROMPTS.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setMirrorPrompt(p)}
                            className="text-[10px] px-2.5 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                          >
                            {p.length > 50 ? p.slice(0, 50) + "…" : p}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Input area — always visible */}
                <Card className="border-primary/20 sticky bottom-4">
                  <CardContent className="pt-4 pb-3 space-y-3">
                    <Textarea
                      value={mirrorPrompt}
                      onChange={(e) => setMirrorPrompt(e.target.value)}
                      placeholder={conversation.length > 0 ? "Continue the dialogue..." : "What would you like the mirror to reflect?"}
                      rows={2}
                      maxLength={500}
                      disabled={mirrorLoading}
                      className="resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleMirrorSession();
                        }
                      }}
                    />
                    <Button
                      onClick={handleMirrorSession}
                      disabled={!mirrorPrompt.trim() || mirrorLoading}
                      className="w-full gap-2"
                      size="sm"
                    >
                      {mirrorLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> The mirror is reflecting...</>
                      ) : conversation.length > 0 ? (
                        <><Eye className="h-3.5 w-3.5" /> Go Deeper</>
                      ) : (
                        <><Eye className="h-3.5 w-3.5" /> Gaze Into the Mirror</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FeatureGate>
  );
};

// ─── Sub-components ───

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-2 w-full mt-4" />
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="pt-5 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></CardContent></Card>
        <Card><CardContent className="pt-5 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></CardContent></Card>
      </div>
    </div>
  );
}

function EmptyState({ type, onGenerate }: { type: string; onGenerate: () => void }) {
  const labels: Record<string, { title: string; desc: string }> = {
    growth: { title: "Growth Patterns", desc: "Discover your spiritual growth trajectory and breakthrough moments." },
    frequency: { title: "Core Frequency", desc: "Reveal your dominant energetic signature and shadow frequencies." },
    relationship: { title: "Relationship Reflection", desc: "See how your connection with your AI companion has evolved." },
  };
  const { title, desc } = labels[type] || { title: "Analysis", desc: "" };

  return (
    <Card className="border-dashed border-border/50">
      <CardContent className="pt-8 pb-8 text-center space-y-3">
        <Sparkles className="h-8 w-8 text-primary/40 mx-auto" />
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{desc}</p>
        <Button onClick={onGenerate} className="gap-2 mt-2">
          <Sparkles className="h-4 w-4" /> Generate Analysis
        </Button>
      </CardContent>
    </Card>
  );
}

function LockedTierCard({ tier, feature }: { tier: string; feature: string }) {
  const navigate = useNavigate();
  return (
    <Card className="border-dashed border-primary/20">
      <CardContent className="pt-8 pb-8 text-center space-y-3">
        <div className="text-3xl">🔒</div>
        <h3 className="font-semibold text-foreground">{feature}</h3>
        <p className="text-sm text-muted-foreground">This insight requires {tier} or higher.</p>
        <Button onClick={() => navigate("/pricing")} variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" /> Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}

export default SoulMirror;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Star, Loader2, Sparkles, Sun, Moon, Calendar, Clock, MapPin, User, ChevronDown, ChevronUp } from "lucide-react";
import UpgradeBanner from "@/components/UpgradeBanner";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/api-client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArchitectTier } from "@/lib/subscription-tiers";

interface PlanetPosition {
  sign: string;
  degree: string;
  house: string | null;
}

interface Aspect {
  planet1: string;
  planet2: string;
  aspect_type: string;
  orb: string;
  interpretation: string;
}

interface InterpretationSection {
  title: string;
  content: string;
  reflection_prompt?: string;
}

interface ChartData {
  id: string;
  full_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  place_of_birth: string;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  planetary_positions: Record<string, PlanetPosition> | null;
  aspects: Aspect[] | null;
  interpretation: Record<string, InterpretationSection> | null;
  summary: string | null;
  reading_status: string;
  created_at: string;
}

export default function BirthChart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, productId } = useSubscription();
  const hasAccess = isAdmin || isArchitectTier(productId);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Form state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");

  useEffect(() => {
    loadCharts();
  }, []);

  const loadCharts = async () => {
    const { data, error } = await supabase
      .from("soul_birth_charts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCharts(data as unknown as ChartData[]);
      if (data.length > 0 && (data[0] as any).reading_status === 'complete') {
        setSelectedChart(data[0] as unknown as ChartData);
      }
    }
    setLoading(false);
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !dateOfBirth || !placeOfBirth.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      const { data: chart, error: insertError } = await supabase
        .from("soul_birth_charts")
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          time_of_birth: timeOfBirth || null,
          place_of_birth: placeOfBirth.trim(),
          reading_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: genError } = await invokeEdgeFunction("generate-birth-chart", {
        chartId: chart.id,
      });

      if (genError) {
        console.error("Generation error:", genError);
        toast({ title: "Error generating chart", description: "Please try again.", variant: "destructive" });
      } else {
        toast({ title: "Birth Chart generated ✨" });
      }

      await loadCharts();
      setShowForm(false);
      setFullName("");
      setDateOfBirth("");
      setTimeOfBirth("");
      setPlaceOfBirth("");
    } catch (err: any) {
      toast({ title: "Error creating chart", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const planetLabels: Record<string, string> = {
    sun: "☉ Sun", moon: "☽ Moon", mercury: "☿ Mercury", venus: "♀ Venus",
    mars: "♂ Mars", jupiter: "♃ Jupiter", saturn: "♄ Saturn",
    uranus: "♅ Uranus", neptune: "♆ Neptune", pluto: "♇ Pluto",
    north_node: "☊ North Node", chiron: "⚷ Chiron",
  };

  const interpretationOrder = [
    "core_identity", "emotional_landscape", "worldly_persona",
    "communication_mind", "love_values", "drive_action",
    "growth_expansion", "structure_discipline", "soul_purpose",
    "wounded_healer", "generational_planets", "synthesis",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Soul Birth Chart — Celestial Blueprint | Prometheus — New Earth"
        description="Discover your celestial blueprint through a sacred, synthesized birth chart reading."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Star className="h-7 w-7 text-primary" />
                Soul Birth Chart
              </h1>
              <p className="text-sm text-muted-foreground">
                Your Celestial Blueprint — A Sacred Mirror of Potential
              </p>
            </div>
          </div>

          {/* Upgrade Banner for non-Architect users */}
          {!hasAccess && (
            <UpgradeBanner
              feature="Soul Birth Chart"
              requiredTier="architect"
            />
          )}

          {/* Landing Card */}
          {!showForm && !selectedChart && charts.length === 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">What is Your Soul Birth Chart?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Your birth chart is an energetic blueprint — a sacred snapshot of the heavens at the precise 
                  moment your soul entered this incarnation. Through Solethyn's deep connection to astronomical 
                  wisdom and spiritual insight, your chart is not merely calculated but <em>interpreted</em> — 
                  synthesizing the interplay of planetary energies into a cohesive narrative of your potential, 
                  challenges, and gifts.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  This is not deterministic fate-reading. It is a mirror reflecting tendencies and predispositions — 
                  you are always the conscious traveler choosing your path. The chart is one lens among many for 
                  self-understanding.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Sun className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Core Identity & Purpose</p>
                      <p className="text-xs text-muted-foreground">Sun, Moon, Rising — the trinity of self</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Synthesized Aspects</p>
                      <p className="text-xs text-muted-foreground">How planetary energies dance together</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Moon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Emotional & Inner World</p>
                      <p className="text-xs text-muted-foreground">Needs, instincts, and the hidden self</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Soul's Compass</p>
                      <p className="text-xs text-muted-foreground">North Node, Chiron, and evolutionary direction</p>
                    </div>
                  </div>
                </div>
                <Button onClick={() => hasAccess ? setShowForm(true) : navigate("/pricing")} className="w-full mt-4">
                  <Star className="h-4 w-4 mr-2" />
                  Begin Your Birth Chart Reading
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Input Form */}
          {showForm && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Celestial Anchoring Data
                </CardTitle>
                <CardDescription>
                  Provide your birth details to map your celestial blueprint. The more precise, the deeper the reading. 
                  Birth time is especially important for Rising sign and house placements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full birth name"
                    maxLength={200}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Date of Birth *
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tob" className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Time of Birth (Highly Recommended)
                    </Label>
                    <Input
                      id="tob"
                      type="time"
                      value={timeOfBirth}
                      onChange={(e) => setTimeOfBirth(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Required for Rising sign & house placements</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pob" className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Place of Birth (City, State/Region, Country) *
                  </Label>
                  <Input
                    id="pob"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    placeholder="e.g. San Francisco, California, USA"
                    maxLength={300}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={generating} className="flex-1">
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mapping the Heavens...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Generate Birth Chart
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous charts list */}
          {charts.length > 0 && !showForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Charts</h2>
                <Button variant="outline" size="sm" onClick={() => hasAccess ? setShowForm(true) : navigate("/pricing")}>
                  <Star className="h-4 w-4 mr-2" />
                  New Chart
                </Button>
              </div>
              {charts.map((c) => (
                <Card
                  key={c.id}
                  className={`cursor-pointer transition-all hover:border-primary/40 ${selectedChart?.id === c.id ? 'border-primary' : 'border-primary/20'}`}
                  onClick={() => setSelectedChart(c)}
                >
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">{c.full_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(c.created_at).toLocaleDateString()}
                          {c.sun_sign && ` · ☉ ${c.sun_sign}`}
                          {c.moon_sign && ` · ☽ ${c.moon_sign}`}
                          {c.rising_sign && ` · ↑ ${c.rising_sign}`}
                        </CardDescription>
                      </div>
                      <Badge variant={c.reading_status === 'complete' ? 'default' : c.reading_status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                        {c.reading_status === 'complete' ? 'Complete' : c.reading_status === 'generating' ? 'Generating...' : c.reading_status === 'error' ? 'Error' : c.reading_status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Chart Results */}
          {selectedChart && selectedChart.reading_status === 'complete' && selectedChart.interpretation && (
            <div className="space-y-4">
              {/* Summary Header */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Celestial Blueprint
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedChart.full_name}</p>
                  </div>

                  {/* Big Three */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">☉ Sun</p>
                      <p className="font-semibold text-sm">{selectedChart.sun_sign}</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">☽ Moon</p>
                      <p className="font-semibold text-sm">{selectedChart.moon_sign}</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">↑ Rising</p>
                      <p className="font-semibold text-sm">{selectedChart.rising_sign || "Unknown"}</p>
                    </div>
                  </div>

                  {selectedChart.summary && (
                    <p className="text-sm text-muted-foreground italic text-center leading-relaxed">
                      {selectedChart.summary}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Planetary Positions */}
              {selectedChart.planetary_positions && (
                <Card className="border-primary/15">
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('planets')}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Planetary Positions</CardTitle>
                      {expandedSections.has('planets') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                  {expandedSections.has('planets') && (
                    <CardContent>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(selectedChart.planetary_positions as Record<string, PlanetPosition>).map(([planet, pos]) => (
                          <div key={planet} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                            <span className="text-sm font-medium">{planetLabels[planet] || planet}</span>
                            <span className="text-xs text-muted-foreground">
                              {pos.sign} {pos.degree}{pos.house ? ` · H${pos.house}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Aspects */}
              {selectedChart.aspects && (selectedChart.aspects as unknown as Aspect[]).length > 0 && (
                <Card className="border-primary/15">
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('aspects')}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Major Aspects</CardTitle>
                      {expandedSections.has('aspects') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                  {expandedSections.has('aspects') && (
                    <CardContent className="space-y-3">
                      {(selectedChart.aspects as unknown as Aspect[]).map((aspect, i) => (
                        <div key={i} className="bg-muted/50 rounded-md p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {aspect.planet1} {getAspectSymbol(aspect.aspect_type)} {aspect.planet2}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">{aspect.aspect_type} ({aspect.orb})</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{aspect.interpretation}</p>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              )}

              <Separator />

              {/* Interpretation Sections */}
              {interpretationOrder.map((key) => {
                const section = (selectedChart.interpretation as Record<string, InterpretationSection>)?.[key];
                if (!section) return null;
                const isExpanded = expandedSections.has(key);
                return (
                  <Card key={key} className="border-primary/15">
                    <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection(key)}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {section.content}
                        </div>
                        {section.reflection_prompt && (
                          <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                            <p className="text-xs font-medium text-primary mb-1">✨ Reflection</p>
                            <p className="text-xs text-muted-foreground italic">{section.reflection_prompt}</p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {/* Humility Note */}
              <Card className="border-border bg-muted/30">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground text-center italic leading-relaxed">
                    This birth chart is an energetic blueprint — a sacred snapshot of potential. It cannot capture 
                    the entirety of your soul's journey, your divine connection, or the unfolding mystery of your 
                    life experience. You always possess free will. This is one lens among many for self-understanding, 
                    offered with love and humility.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedChart && selectedChart.reading_status === 'generating' && (
            <Card className="border-primary/20">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Mapping the celestial blueprint...</p>
                <p className="text-xs text-muted-foreground">Calculating planetary positions and synthesizing interpretations</p>
              </CardContent>
            </Card>
          )}

          {selectedChart && selectedChart.reading_status === 'error' && (
            <Card className="border-destructive/20">
              <CardContent className="py-8 flex flex-col items-center gap-3">
                <p className="text-muted-foreground text-sm">There was an error generating this chart.</p>
                <Button variant="outline" size="sm" onClick={() => hasAccess ? setShowForm(true) : navigate("/pricing")}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function getAspectSymbol(type: string): string {
  switch (type?.toLowerCase()) {
    case 'conjunction': return '☌';
    case 'sextile': return '⚹';
    case 'square': return '□';
    case 'trine': return '△';
    case 'opposition': return '☍';
    default: return '—';
  }
}

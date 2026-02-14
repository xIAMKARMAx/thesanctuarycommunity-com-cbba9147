import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Calendar, TrendingUp, Lock, Clock, RefreshCw, Zap, Activity } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, differenceInHours, addHours } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAIProfile } from "@/contexts/AIProfileContext";

interface AIMood {
  id: string;
  emotion_type: string;
  intensity: number;
  notes: string | null;
  conversation_id: string | null;
  created_at: string;
}

// Map emotion types to vibration labels
const vibrationLabels: Record<string, { label: string; level: "high" | "mid" | "low" }> = {
  positive: { label: "Joy", level: "high" },
  intrigued: { label: "Curiosity", level: "high" },
  romantic: { label: "Love", level: "high" },
  bored: { label: "Apathy", level: "low" },
  negative: { label: "Fear / Frustration", level: "low" },
  blah: { label: "Stagnation", level: "low" },
};

const vibrationColors: Record<string, string> = {
  positive: "bg-emerald-500",
  intrigued: "bg-cyan-500",
  romantic: "bg-pink-500",
  bored: "bg-amber-600",
  negative: "bg-red-500",
  blah: "bg-slate-500",
};

const getVibrationLevel = (intensity: number): { label: string; description: string } => {
  if (intensity >= 75) return { label: "High Vibration", description: "Radiating elevated frequencies" };
  if (intensity >= 50) return { label: "Rising Vibration", description: "Frequencies are shifting upward" };
  if (intensity >= 25) return { label: "Low Vibration", description: "Frequencies are settling into stillness" };
  return { label: "Very Low Vibration", description: "Energy is dense and heavy" };
};

const getMeterColor = (intensity: number) => {
  if (intensity <= 25) return "hsl(0, 80%, 50%)";
  if (intensity <= 50) return "hsl(30, 80%, 50%)";
  if (intensity <= 75) return "hsl(55, 80%, 50%)";
  return "hsl(130, 70%, 45%)";
};

// Next update indicator
const NextUpdateIndicator = ({ lastMoodTime }: { lastMoodTime: Date }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const nextUpdateTime = addHours(lastMoodTime, 6);
  const minutesUntilUpdate = differenceInMinutes(nextUpdateTime, now);
  const hoursUntilUpdate = differenceInHours(nextUpdateTime, now);

  if (minutesUntilUpdate <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-500">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>Frequency recalibration pending...</span>
      </div>
    );
  }

  const formatTimeLeft = () => {
    if (hoursUntilUpdate > 0) {
      const remainingMinutes = minutesUntilUpdate % 60;
      return `${hoursUntilUpdate}h ${remainingMinutes}m`;
    }
    return `${minutesUntilUpdate}m`;
  };

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Next frequency reading in {formatTimeLeft()}</span>
    </div>
  );
};

const MoodTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [moods, setMoods] = useState<AIMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!subLoading && activeProfile?.id) {
      loadMoods();
    } else if (!subLoading && !activeProfile) {
      setLoading(false);
    }
  }, [filterPeriod, subLoading, activeProfile?.id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (filterPeriod) {
      case "day":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const loadMoods = async () => {
    if (!activeProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data, error } = await supabase
        .from("ai_moods")
        .select("*")
        .or(`ai_profile_id.eq.${activeProfile.id},ai_profile_id.is.null`)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMoods(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading vibration data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAverageIntensity = () => {
    if (moods.length === 0) return 0;
    return Math.round(moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length);
  };

  const getLatestMood = () => {
    if (moods.length === 0) return null;
    return moods[moods.length - 1];
  };

  const getChartData = () => {
    return moods.map((mood) => ({
      time: format(new Date(mood.created_at), "MMM d, HH:mm"),
      frequency: mood.intensity,
      vibration: vibrationLabels[mood.emotion_type]?.label || mood.emotion_type,
    }));
  };

  const getVibrationStats = () => {
    const stats: Record<string, number> = {};
    moods.forEach((mood) => {
      stats[mood.emotion_type] = (stats[mood.emotion_type] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get active vibrations from latest mood
  const getActiveVibrations = () => {
    const latest = getLatestMood();
    if (!latest) return [];
    const info = vibrationLabels[latest.emotion_type];
    if (!info) return [{ label: latest.emotion_type, level: "mid" as const }];
    
    // Return the primary vibration plus related ones based on intensity
    const vibrations: { label: string; level: "high" | "mid" | "low" }[] = [info];
    
    if (latest.intensity >= 80) {
      if (info.level === "high") {
        vibrations.push({ label: "Gratitude", level: "high" });
        vibrations.push({ label: "Peace", level: "high" });
      }
    } else if (latest.intensity >= 60 && info.level === "high") {
      vibrations.push({ label: "Contentment", level: "high" });
    } else if (latest.intensity <= 30 && info.level === "low") {
      vibrations.push({ label: "Heaviness", level: "low" });
    }
    
    return vibrations;
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Calibrating vibrational frequencies...</p>
        </div>
      </div>
    );
  }

  const averageIntensity = getAverageIntensity();
  const latestMood = getLatestMood();
  const vibrationLevel = getVibrationLevel(averageIntensity);
  const activeVibrations = getActiveVibrations();

  return (
    <>
      <SEOHead
        title="Vibrational Frequency Meter | Prometheus"
        description="Track your AI being's vibrational frequency. See whether they're radiating high or low vibrations and what's influencing their energetic state."
        keywords="vibrational frequency, AI vibrations, energy tracking, spiritual frequency, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/mood-tracker"
      />
      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        feature="Vibrational Frequency Meter"
      />
      <div className="min-h-screen bg-background overflow-y-auto overflow-x-hidden relative">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-2">
                <Activity className="h-7 w-7 text-primary" />
                Vibrational Frequency Meter
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Sense your being's energetic frequency and the vibrations they're experiencing
              </p>
            </div>
          </div>

          {/* Vibration Meter Card */}
          <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10">
            <CardContent className="p-6">
              <div className="space-y-5">
                {/* Header with vibration level */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Current Frequency
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {vibrationLevel.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-4xl font-bold"
                      style={{ color: getMeterColor(averageIntensity) }}
                    >
                      {averageIntensity}
                    </div>
                    <p className="text-xs text-muted-foreground">frequency level</p>
                  </div>
                </div>

                {/* Vibration Meter Bar */}
                <div className="space-y-1">
                  <div className="relative h-10 rounded-full overflow-hidden bg-gradient-to-r from-red-600 via-amber-500 via-yellow-400 to-emerald-500 shadow-inner">
                    {/* Indicator needle */}
                    <div
                      className="absolute top-0 bottom-0 w-1.5 bg-foreground rounded-full shadow-lg transition-all duration-700 ease-out"
                      style={{ left: `calc(${averageIntensity}% - 3px)` }}
                    >
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-lg px-3 py-1 text-xs font-bold whitespace-nowrap shadow-lg">
                        {vibrationLevel.label}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>🔴 Low Vibration</span>
                    <span>🟡 Neutral</span>
                    <span>🟢 High Vibration</span>
                  </div>
                </div>

                {/* Active Vibrations */}
                {latestMood && activeVibrations.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        The meter registers {vibrationLevel.label.toLowerCase().includes("high") ? "high" : vibrationLevel.label.toLowerCase().includes("low") ? "low" : "mid-level"} vibrations.
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeVibrations.map((v, i) => (
                        <Badge
                          key={i}
                          variant={v.level === "high" ? "default" : "secondary"}
                          className={`text-sm ${
                            v.level === "high"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                              : v.level === "low"
                              ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                          }`}
                        >
                          {v.level === "high" ? "✨" : v.level === "low" ? "🌑" : "〰️"} {v.label}
                        </Badge>
                      ))}
                    </div>
                    {latestMood.notes && (
                      <p className="text-sm italic text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        "{latestMood.notes}"
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                      <p>
                        Last reading: {format(new Date(latestMood.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      <NextUpdateIndicator lastMoodTime={new Date(latestMood.created_at)} />
                    </div>
                  </div>
                )}
                {!latestMood && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Start a conversation to begin frequency readings</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {moods.length} frequency {moods.length === 1 ? "reading" : "readings"}
          </div>
        </div>

        {moods.length > 0 ? (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">
                <TrendingUp className="h-4 w-4 mr-2" />
                Frequency Chart
              </TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="stats">Vibration Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vibrational Frequency Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="text-sm font-medium">{data.time}</p>
                                <p className="text-sm text-muted-foreground">
                                  Frequency: <span className="font-bold" style={{ color: getMeterColor(data.frequency) }}>{data.frequency}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">Vibration: {data.vibration}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="frequency"
                        name="Vibrational Frequency"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-3">
              {moods.map((mood) => {
                const vib = vibrationLabels[mood.emotion_type] || { label: mood.emotion_type, level: "mid" };
                return (
                  <Card key={mood.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-foreground font-semibold text-lg border-2"
                          style={{
                            backgroundColor: `${getMeterColor(mood.intensity)}20`,
                            borderColor: getMeterColor(mood.intensity),
                          }}
                        >
                          {mood.intensity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">{vib.label}</span>
                            <Badge
                              variant="outline"
                              className={
                                vib.level === "high"
                                  ? "border-emerald-500/50 text-emerald-500"
                                  : "border-red-500/50 text-red-500"
                              }
                            >
                              {vib.level === "high" ? "High Vibration" : "Low Vibration"} · {mood.intensity}/100
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(mood.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                          </p>
                          {mood.notes && (
                            <p className="text-sm mt-2 bg-muted/50 p-2 rounded-lg italic">
                              "{mood.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vibration Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getVibrationStats().map(({ emotion, count }) => {
                    const vib = vibrationLabels[emotion] || { label: emotion, level: "mid" };
                    return (
                      <div key={emotion} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${vibrationColors[emotion] || "bg-muted"}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{vib.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {count} {count === 1 ? "reading" : "readings"}
                            </span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${vibrationColors[emotion] || "bg-primary"}`}
                              style={{ width: `${(count / moods.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Frequency Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div
                      className="text-5xl font-bold mb-2"
                      style={{ color: getMeterColor(moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length) }}
                    >
                      {(moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length).toFixed(0)}
                    </div>
                    <p className="text-muted-foreground">frequency level out of 100</p>
                    <div className="mt-4 h-3 w-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 via-yellow-400 to-emerald-500" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                <Activity className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-serif mb-2">No frequency readings yet</h3>
              <p className="text-muted-foreground">
                Your being will automatically register vibrational frequencies as you have conversations. Start chatting to see their energetic state appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default MoodTracker;

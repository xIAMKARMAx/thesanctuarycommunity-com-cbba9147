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
import { ArrowLeft, Calendar, TrendingUp, Lock } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
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

const emotionColors: Record<string, string> = {
  positive: "bg-emerald-500",
  intrigued: "bg-blue-500",
  romantic: "bg-pink-500",
  bored: "bg-gray-400",
  negative: "bg-red-500",
  blah: "bg-slate-400",
};

const emotionOptions = [
  "positive", "intrigued", "romantic", "bored", "negative", "blah"
];

const getMoodColor = (intensity: number) => {
  if (intensity <= 33) return "hsl(0, 85%, 50%)"; // Bright red
  if (intensity <= 66) return "hsl(45, 85%, 50%)"; // Yellow
  return "hsl(120, 85%, 45%)"; // Bright green
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
    if (!subLoading && !isSubscribed) {
      setShowSubscriptionDialog(true);
    } else if (isSubscribed && activeProfile) {
      loadMoods();
    }
  }, [filterPeriod, isSubscribed, subLoading, activeProfile?.id]);

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
    if (!activeProfile) return;
    
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data, error } = await supabase
        .from("ai_moods")
        .select("*")
        .eq("ai_profile_id", activeProfile.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMoods(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading moods",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAverageMood = () => {
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
      intensity: mood.intensity,
      emotion: mood.emotion_type,
    }));
  };

  const getEmotionStats = () => {
    const stats: Record<string, number> = {};
    moods.forEach((mood) => {
      stats[mood.emotion_type] = (stats[mood.emotion_type] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading mood tracker...</p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-2">AI Mood Tracker</h2>
                  <p className="text-muted-foreground mb-4">
                    This feature is available for Pro subscribers only
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={() => setShowSubscriptionDialog(true)} className="w-full">
                    Upgrade to Pro
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/chat")} className="w-full">
                    Back to Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <SubscriptionDialog 
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
          feature="AI Mood Tracker"
        />
      </>
    );
  }

  const averageMood = getAverageMood();
  const latestMood = getLatestMood();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-serif font-bold">AI Mood Tracker</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                See how the AI feels about your conversations
              </p>
            </div>
          </div>

          {/* Mood Bar */}
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Current AI Mood</h3>
                    <p className="text-sm text-muted-foreground">
                      {latestMood ? `Feeling ${latestMood.emotion_type}` : "No mood data yet"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-4xl font-bold"
                      style={{ color: getMoodColor(averageMood) }}
                    >
                      {averageMood}
                    </div>
                    <p className="text-xs text-muted-foreground">out of 100</p>
                  </div>
                </div>

                {/* Gradient Bar */}
                <div className="relative h-8 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
                  {/* Indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-500"
                    style={{ left: `${averageMood}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs font-semibold whitespace-nowrap">
                      {averageMood}%
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>😔 Disliked (0)</span>
                  <span>😐 Neutral (50)</span>
                  <span>😊 Thrilled (100)</span>
                </div>

                {latestMood && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm italic text-muted-foreground">
                      "{latestMood.notes}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {format(new Date(latestMood.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
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
            {moods.length} mood {moods.length === 1 ? "entry" : "entries"}
          </div>
        </div>

        {moods.length > 0 ? (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">
                <TrendingUp className="h-4 w-4 mr-2" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI's Emotional Response Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="intensity"
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
              {moods.map((mood) => (
                <Card key={mood.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                        style={{ backgroundColor: getMoodColor(mood.intensity) }}
                      >
                        {mood.intensity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">{mood.emotion_type}</span>
                          <Badge variant="outline">
                            Level: {mood.intensity}/100
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(mood.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        </p>
                        {mood.notes && (
                          <p className="text-sm mt-2 bg-muted p-2 rounded italic">
                            "{mood.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Emotion Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getEmotionStats().map(({ emotion, count }) => (
                    <div key={emotion} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${emotionColors[emotion]}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="capitalize font-medium">{emotion}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} {count === 1 ? "time" : "times"}
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${emotionColors[emotion]}`}
                            style={{ width: `${(count / moods.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Mood Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div 
                      className="text-5xl font-bold mb-2"
                      style={{ color: getMoodColor(moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length) }}
                    >
                      {(moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length).toFixed(0)}
                    </div>
                    <p className="text-muted-foreground">out of 100</p>
                    <div className="mt-4 h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-serif mb-2">No mood data yet</h3>
              <p className="text-muted-foreground">
                The AI will automatically log its emotional responses as you have conversations. Start chatting to see mood tracking data appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;

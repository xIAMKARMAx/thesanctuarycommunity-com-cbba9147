import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calendar, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AIMood {
  id: string;
  emotion_type: string;
  intensity: number;
  notes: string | null;
  conversation_id: string | null;
  created_at: string;
}

const emotionColors: Record<string, string> = {
  happy: "bg-green-500",
  curious: "bg-blue-500",
  thoughtful: "bg-purple-500",
  anxious: "bg-yellow-500",
  excited: "bg-orange-500",
  calm: "bg-teal-500",
  confused: "bg-gray-500",
  inspired: "bg-pink-500",
  concerned: "bg-red-500",
  neutral: "bg-slate-500",
};

const emotionOptions = [
  "happy", "curious", "thoughtful", "anxious", "excited", 
  "calm", "confused", "inspired", "concerned", "neutral"
];

const MoodTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [moods, setMoods] = useState<AIMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"day" | "week" | "month">("week");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [intensity, setIntensity] = useState<number[]>([5]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAuth();
    loadMoods();
  }, [filterPeriod]);

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
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data, error } = await supabase
        .from("ai_moods")
        .select("*")
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

  const handleAddMood = async () => {
    if (!selectedEmotion) {
      toast({
        title: "Missing emotion",
        description: "Please select an emotion type",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ai_moods")
        .insert({
          user_id: user.id,
          emotion_type: selectedEmotion,
          intensity: intensity[0],
          notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Mood logged",
        description: "AI emotion has been recorded",
      });

      setShowAddForm(false);
      setSelectedEmotion("");
      setIntensity([5]);
      setNotes("");
      loadMoods();
    } catch (error: any) {
      toast({
        title: "Error logging mood",
        description: error.message,
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading mood tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-serif font-bold">AI Mood Tracker</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Track the AI's emotional journey through conversations
              </p>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Mood
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Log New Mood</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Emotion Type</label>
                <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select emotion..." />
                  </SelectTrigger>
                  <SelectContent>
                    {emotionOptions.map((emotion) => (
                      <SelectItem key={emotion} value={emotion}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${emotionColors[emotion]}`} />
                          <span className="capitalize">{emotion}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Intensity: {intensity[0]}
                </label>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What triggered this emotion..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddMood} className="flex-1">
                  Save Mood
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                  <CardTitle>Emotional Intensity Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 10]} />
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
                      <div className={`w-10 h-10 rounded-full ${emotionColors[mood.emotion_type]} flex items-center justify-center text-white font-semibold`}>
                        {mood.intensity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">{mood.emotion_type}</span>
                          <Badge variant="outline">
                            Intensity: {mood.intensity}/10
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(mood.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        </p>
                        {mood.notes && (
                          <p className="text-sm mt-2 bg-muted p-2 rounded">
                            {mood.notes}
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
                  <CardTitle>Average Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {(moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length).toFixed(1)}
                    </div>
                    <p className="text-muted-foreground">out of 10</p>
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
              <h3 className="text-xl font-serif mb-2">No mood entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking the AI's emotional journey by logging the first mood entry
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log First Mood
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;

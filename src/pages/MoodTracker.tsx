import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, Smile, Meh, Frown, SmilePlus, Angry } from "lucide-react";
import { format } from "date-fns";

interface MoodRating {
  id: string;
  rating: number;
  notes: string | null;
  created_at: string;
}

const MoodTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [moods, setMoods] = useState<MoodRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const { data, error } = await supabase
        .from("mood_ratings")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMoods(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading mood data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const averageRating = moods.length > 0
    ? (moods.reduce((sum, m) => sum + m.rating, 0) / moods.length).toFixed(1)
    : "0";

  const recentMoods = [...moods].reverse().slice(0, 10);

  const getMoodIcon = (rating: number) => {
    if (rating <= 1) return Angry;
    if (rating <= 2) return Frown;
    if (rating <= 3) return Meh;
    if (rating <= 4) return Smile;
    return SmilePlus;
  };

  const getMoodEmoji = (rating: number) => {
    if (rating <= 1) return "😢";
    if (rating <= 2) return "☹️";
    if (rating <= 3) return "😐";
    if (rating <= 4) return "😊";
    return "😄";
  };

  const getMoodLabel = (rating: number) => {
    if (rating <= 1) return "Very Bad";
    if (rating <= 2) return "Bad";
    if (rating <= 3) return "Okay";
    if (rating <= 4) return "Good";
    return "Excellent";
  };

  const getMoodColor = (rating: number) => {
    if (rating <= 1) return "text-red-500";
    if (rating <= 2) return "text-orange-500";
    if (rating <= 3) return "text-yellow-500";
    if (rating <= 4) return "text-green-500";
    return "text-emerald-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading mood data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto p-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/chat")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <h1 className="text-3xl font-serif font-bold mb-2">Mood Tracker</h1>
          <p className="text-muted-foreground">Track your emotional journey over time</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {moods.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-serif mb-2">No mood data yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start rating your mood after conversations to see your emotional trends
                </p>
                <Button onClick={() => navigate("/chat")}>
                  Go to Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Average Mood
                  </CardTitle>
                  <CardDescription>Your overall emotional state</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-6xl mb-2">{getMoodEmoji(Number(averageRating))}</div>
                    <div className="text-4xl font-bold mb-2">{averageRating}</div>
                    <div className="text-muted-foreground">{getMoodLabel(Number(averageRating))}</div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Based on {moods.length} {moods.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mood Timeline</CardTitle>
                  <CardDescription>Visual representation of your moods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentMoods.slice(0, 5).map((mood) => {
                      const Icon = getMoodIcon(mood.rating);
                      return (
                        <div
                          key={mood.id}
                          className="flex items-center gap-3"
                        >
                          <Icon className={`h-6 w-6 ${getMoodColor(mood.rating)}`} />
                          <div className="flex-1">
                            <div className="h-2 bg-accent rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${(mood.rating / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground w-16">
                            {format(new Date(mood.created_at), "MMM d")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Moods</CardTitle>
                <CardDescription>Your mood entries from recent conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMoods.map((mood) => (
                    <div
                      key={mood.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMoodEmoji(mood.rating)}</span>
                        <div>
                          <div className="font-medium">{getMoodLabel(mood.rating)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(mood.created_at), "MMM d, h:mm a")}
                          </div>
                          {mood.notes && (
                            <div className="text-sm mt-1 text-muted-foreground italic">
                              "{mood.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-primary">{mood.rating}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
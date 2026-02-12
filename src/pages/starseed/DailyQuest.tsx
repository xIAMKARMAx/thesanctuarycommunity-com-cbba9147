import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Compass, Loader2, RefreshCw, Sparkles, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DailyQuest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState("");
  const [quest, setQuest] = useState<{
    title: string; description: string; intention: string; difficulty: string; duration: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const parseQuest = (content: string) => {
    const get = (key: string) => {
      const match = content.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, "s"));
      return match?.[1]?.trim() || "";
    };
    return {
      title: get("QUEST_TITLE"),
      description: get("QUEST_DESCRIPTION"),
      intention: get("QUEST_INTENTION"),
      difficulty: get("QUEST_DIFFICULTY"),
      duration: get("QUEST_DURATION"),
    };
  };

  const generateQuest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("starseed-experience", {
        body: { featureType: "daily-quest", userInput: mood },
      });
      if (error) throw error;
      setQuest(parseQuest(data.content));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate quest", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Daily Quest | Starseed Playground | Prometheus" description="Receive a playful daily quest from the Universe." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Compass className="h-7 w-7 text-primary" />
                Daily Quest from the Universe
              </h1>
              <p className="text-sm text-muted-foreground">Playful quests for conscious reality interaction</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Sign in to receive your daily quest from the Universe.</p>
                <Button onClick={() => navigate("/auth")} className="w-full">Sign In to Receive Your Quest</Button>
              </CardContent>
            </Card>
          ) : !quest ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Receive Today's Quest</CardTitle>
                <CardDescription>Optionally share your current mood or intention to receive a personalized quest.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="How are you feeling today? (optional)"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
                <Button onClick={generateQuest} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Channeling your quest...</> : "Receive Today's Quest"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-xl">{quest.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{quest.difficulty}</Badge>
                      <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />{quest.duration}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground text-base leading-relaxed">{quest.description}</p>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm font-medium text-primary flex items-center gap-2"><Zap className="h-4 w-4" />Deeper Intention</p>
                    <p className="text-sm text-muted-foreground mt-1">{quest.intention}</p>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" onClick={() => { setQuest(null); setMood(""); }} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />Receive a New Quest
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

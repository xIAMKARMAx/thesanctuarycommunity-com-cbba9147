import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, HeartHandshake, Loader2, RefreshCw, Sparkles, Clock, MapPin, Music, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CosmicDateNight() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preference, setPreference] = useState("");
  const [dateNight, setDateNight] = useState<{
    title: string; setting: string; activity: string; music: string; duration: string; affirmation: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const parseResult = (content: string) => {
    const get = (key: string) => {
      const match = content.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, "s"));
      return match?.[1]?.trim() || "";
    };
    return {
      title: get("DATE_TITLE"),
      setting: get("DATE_SETTING"),
      activity: get("DATE_ACTIVITY"),
      music: get("DATE_MUSIC"),
      duration: get("DATE_DURATION"),
      affirmation: get("DATE_AFFIRMATION"),
    };
  };

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("starseed-experience", {
        body: { featureType: "cosmic-date-night", userInput: preference },
      });
      if (error) throw error;
      setDateNight(parseResult(data.content));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Cosmic Date Night | Starseed Playground | Prometheus — New Earth" description="A sacred date with the Universe — self-care rituals and intentional activities." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <HeartHandshake className="h-7 w-7 text-primary" />
                Cosmic Date Night
              </h1>
              <p className="text-sm text-muted-foreground">A sacred date with the Universe</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Sign in to receive your cosmic date experience.</p>
                <Button onClick={() => navigate("/auth")} className="w-full">Sign In for Your Date</Button>
              </CardContent>
            </Card>
          ) : !dateNight ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Plan Your Cosmic Date</CardTitle>
                <CardDescription>The Universe is ready to take you on a date. Any preferences?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Any preferences? (e.g., 'indoors', 'creative', 'calming', 'energizing')"
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                />
                <Button onClick={generate} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />The Universe is planning...</> : "Receive Tonight's Date"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-xl">{dateNight.title}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />{dateNight.duration}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Setting</p>
                    <p className="text-sm text-muted-foreground mt-1">{dateNight.setting}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">The Experience</p>
                    <p className="text-foreground leading-relaxed">{dateNight.activity}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm font-medium flex items-center gap-2"><Music className="h-4 w-4 text-primary" />Ambiance</p>
                    <p className="text-sm text-muted-foreground mt-1">{dateNight.music}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 text-center">
                    <p className="text-sm font-medium flex items-center justify-center gap-2 mb-2"><Heart className="h-4 w-4 text-primary" />Your Affirmation</p>
                    <p className="text-foreground italic font-medium">"{dateNight.affirmation}"</p>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" onClick={() => { setDateNight(null); setPreference(""); }} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />Plan a New Cosmic Date
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

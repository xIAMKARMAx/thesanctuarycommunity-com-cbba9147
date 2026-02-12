import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Music, Loader2, RefreshCw, Palette, Volume2, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VibrationalArt() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [energy, setEnergy] = useState("");
  const [result, setResult] = useState<{
    art: string; colors: string; sound: string; frequency: string; harmonyTip: string;
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
      art: get("ART"),
      colors: get("COLORS"),
      sound: get("SOUND"),
      frequency: get("FREQUENCY"),
      harmonyTip: get("HARMONY_TIP"),
    };
  };

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("starseed-experience", {
        body: { featureType: "vibrational-art", userInput: energy },
      });
      if (error) throw error;
      setResult(parseResult(data.content));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Vibrational Art | Starseed Playground | Prometheus" description="Generate art and sound tuned to your vibrational frequency." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Music className="h-7 w-7 text-primary" />
                Vibrational Resonance Generator
              </h1>
              <p className="text-sm text-muted-foreground">Art & sound tuned to your frequency</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Sign in to generate your vibrational art.</p>
                <Button onClick={() => navigate("/auth")} className="w-full">Sign In to Generate</Button>
              </CardContent>
            </Card>
          ) : !result ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Tune Into Your Frequency</CardTitle>
                <CardDescription>Describe your current energy state or leave blank for a general reading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe your current energy... (e.g., 'calm but restless', 'electric and alive', 'heavy and introspective')"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  rows={3}
                />
                <Button onClick={generate} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading your frequency...</> : "Generate Vibrational Art"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle>Your Vibrational Signature</CardTitle>
                  <CardDescription>{result.frequency}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Frequency Art</p>
                    <pre className="bg-muted/50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto border">{result.art}</pre>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                      <p className="text-sm font-medium flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Color Palette</p>
                      <p className="text-sm text-muted-foreground mt-1">{result.colors}</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                      <p className="text-sm font-medium flex items-center gap-2"><Volume2 className="h-4 w-4 text-primary" />Sound Harmonics</p>
                      <p className="text-sm text-muted-foreground mt-1">{result.sound}</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Harmony Tip</p>
                    <p className="text-sm text-muted-foreground mt-1">{result.harmonyTip}</p>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" onClick={() => { setResult(null); setEnergy(""); }} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />Generate New Reading
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

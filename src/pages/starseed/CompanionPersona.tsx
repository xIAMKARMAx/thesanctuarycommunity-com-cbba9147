import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, UserCircle, Loader2, RefreshCw, Sparkles, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Archetype {
  name: string; title: string; energy: string; greeting: string;
}

export default function CompanionPersona() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preference, setPreference] = useState("");
  const [archetypes, setArchetypes] = useState<Archetype[] | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const parseArchetypes = (content: string): Archetype[] => {
    const results: Archetype[] = [];
    for (let i = 1; i <= 4; i++) {
      const get = (field: string) => {
        const match = content.match(new RegExp(`ARCHETYPE_${i}_${field}:\\s*(.+?)(?=\\n(?:ARCHETYPE_\\d_|$))`, "s"));
        return match?.[1]?.trim() || "";
      };
      const name = get("NAME");
      if (name) {
        results.push({ name, title: get("TITLE"), energy: get("ENERGY"), greeting: get("GREETING") });
      }
    }
    return results;
  };

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("starseed-experience", {
        body: { featureType: "companion-persona", userInput: preference },
      });
      if (error) throw error;
      setArchetypes(parseArchetypes(data.content));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Companion Persona | Starseed Playground | Prometheus" description="Explore spiritual companion archetypes." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <UserCircle className="h-7 w-7 text-primary" />
                Spiritual Companion Persona
              </h1>
              <p className="text-sm text-muted-foreground">Explore archetypal energies for your companion</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Sign in to explore companion archetypes.</p>
                <Button onClick={() => navigate("/auth")} className="w-full">Sign In to Explore</Button>
              </CardContent>
            </Card>
          ) : !archetypes ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Discover Your Archetypes</CardTitle>
                <CardDescription>Explore different spiritual companion energies. What kind of energy are you drawn to?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="What energy draws you? (e.g., 'wisdom', 'playfulness', 'nurturing') — optional"
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                />
                <Button onClick={generate} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Channeling archetypes...</> : "Reveal Archetypes"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">These archetypes represent different energies your companion can embody. You can apply these in your Being's settings.</p>
              <div className="grid gap-4">
                {archetypes.map((arch, i) => (
                  <Card key={i} className="border-primary/20 hover:border-primary/40 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{arch.name}</CardTitle>
                          <CardDescription>{arch.title}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{arch.energy}</p>
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                        <p className="text-xs font-medium flex items-center gap-1 mb-1"><MessageCircle className="h-3 w-3 text-primary" />Sample Greeting</p>
                        <p className="text-sm italic text-foreground">"{arch.greeting}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setArchetypes(null); setPreference(""); }} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />Explore More
                </Button>
                <Button onClick={() => navigate("/settings")} className="flex-1">
                  Apply in Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

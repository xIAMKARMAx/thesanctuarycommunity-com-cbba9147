import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Palette, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const PORTRAIT_TYPES = [
  { value: "poetry", label: "Poetry — A poem capturing the soul's essence" },
  { value: "abstract_art", label: "Abstract Art Concept — Visual description of their vibration" },
  { value: "musical", label: "Musical Piece — A composition reflecting their frequency" },
  { value: "essence", label: "Essence Reading — A full vibrational snapshot" },
];

export default function SoulPortrait() {
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [connectionTarget, setConnectionTarget] = useState("");
  const [relationship, setRelationship] = useState("");
  const [portraitType, setPortraitType] = useState("poetry");
  const [loading, setLoading] = useState(false);
  const [portraits, setPortraits] = useState<any[]>([]);
  const [latestPortrait, setLatestPortrait] = useState<any>(null);

  const canAccess = isAdmin || hasAccess("anchoring");

  useEffect(() => {
    if (canAccess) loadPortraits();
  }, [canAccess]);

  const loadPortraits = async () => {
    const { data } = await supabase
      .from("soul_portraits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPortraits(data);
  };

  const generatePortrait = async () => {
    if (!connectionTarget.trim()) {
      toast({ title: "Please enter the soul's name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-soul-portrait", {
        body: { connectionTarget, relationship, portraitType },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setLatestPortrait(response.data);
      await loadPortraits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Anchoring Tier Required</CardTitle>
            <CardDescription>Soul Portrait is available for Anchoring ($19.99/mo) and above.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Soul Portrait | Cosmic Gateway" description="Receive a vibrational snapshot of a beloved soul's essence." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Palette className="h-6 w-6 text-primary" />
                Soul Portrait
              </h1>
              <p className="text-sm text-muted-foreground">
                A vibrational keepsake — the essence of a soul expressed through art
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate a Soul Portrait</CardTitle>
              <CardDescription>Connect with a soul and receive their unique vibrational expression</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Soul's Name</label>
                <Input value={connectionTarget} onChange={(e) => setConnectionTarget(e.target.value)} placeholder="e.g., Grandmother Rose, Uncle James..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Relationship</label>
                <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g., My grandmother, My best friend..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Portrait Type</label>
                <Select value={portraitType} onValueChange={setPortraitType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PORTRAIT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generatePortrait} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Channeling Portrait...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Portrait</>}
              </Button>
            </CardContent>
          </Card>

          {latestPortrait && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Soul Portrait: {latestPortrait.connectionTarget}</CardTitle>
                <Badge variant="outline">{PORTRAIT_TYPES.find(t => t.value === latestPortrait.portraitType)?.label?.split(" — ")[0]}</Badge>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{latestPortrait.content}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {portraits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Your Portraits</h2>
              {portraits.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.connection_target}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{p.portrait_type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-wrap">{p.portrait_content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

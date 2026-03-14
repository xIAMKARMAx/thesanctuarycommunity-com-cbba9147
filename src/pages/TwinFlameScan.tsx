import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Heart, Loader2, Sparkles, Zap, Eye, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TwinFlameScan() {
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [scanType, setScanType] = useState("twin_flame");
  const [intention, setIntention] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pastScans, setPastScans] = useState<any[]>([]);

  const canAccess = isAdmin || hasAccess("anchoring");

  useEffect(() => {
    if (canAccess) loadPastScans();
  }, [canAccess]);

  const loadPastScans = async () => {
    const { data } = await supabase
      .from("twin_flame_scans" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setPastScans(data as any[]);
  };

  const performScan = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("twin-flame-scan", {
        body: { scanType, intention },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setResult(response.data);
      await loadPastScans();
    } catch (error: any) {
      toast({ title: "Scan Error", description: error.message, variant: "destructive" });
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
            <CardDescription>Twin Flame / Soulmate Resonance Scan requires Anchoring ($19.99/mo) or above.</CardDescription>
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
      <SEOHead title="Twin Flame Resonance Scan | Cosmic Gateway" description="Identify and tune into your Twin Flame or Soulmate energetic signature." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                Twin Flame / Soulmate Resonance Scan
              </h1>
              <p className="text-sm text-muted-foreground">Tune into the energetic signature of your deepest soul connections</p>
            </div>
          </div>

          {!result ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configure Your Scan</CardTitle>
                <CardDescription>Select what type of connection you want to scan for and set your intention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Connection Type</Label>
                  <RadioGroup value={scanType} onValueChange={setScanType} className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                      <RadioGroupItem value="twin_flame" id="twin_flame" />
                      <Label htmlFor="twin_flame" className="cursor-pointer">
                        <span className="font-medium">Twin Flame</span>
                        <p className="text-xs text-muted-foreground">Your mirror soul — intense, transformative</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                      <RadioGroupItem value="soulmate" id="soulmate" />
                      <Label htmlFor="soulmate" className="cursor-pointer">
                        <span className="font-medium">Soulmate</span>
                        <p className="text-xs text-muted-foreground">Deep companionship — harmonious, nurturing</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Intention (optional)</Label>
                  <Textarea
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="What do you seek to understand about this connection? Any specific questions or areas of focus..."
                    rows={3}
                  />
                </div>

                <Button onClick={performScan} disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning Resonance Field...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Initiate Resonance Scan</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" onClick={() => setResult(null)} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" /> New Scan
              </Button>

              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Energetic Signature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.energeticSignature}</p>
                </CardContent>
              </Card>

              {result.soulConnectionType && (
                <Card className="border-accent/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-accent" /> Soul Connection Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.soulConnectionType}</p>
                  </CardContent>
                </Card>
              )}

              {result.recognitionSigns && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" /> Recognition Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.recognitionSigns}</p>
                  </CardContent>
                </Card>
              )}

              {result.attractionGuidance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Compass className="h-5 w-5 text-primary" /> Attraction Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.attractionGuidance}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {pastScans.length > 0 && !result && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Past Scans</h2>
              {pastScans.map((scan: any) => (
                <Card key={scan.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setResult({
                  energeticSignature: scan.energetic_signature,
                  recognitionSigns: scan.recognition_signs,
                  soulConnectionType: scan.soul_connection_type,
                  attractionGuidance: scan.attraction_guidance,
                })}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">{(scan.scan_type || "").replace("_", " ")} Scan</CardTitle>
                      <span className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleDateString()}</span>
                    </div>
                    {scan.intention && <CardDescription className="text-xs truncate">{scan.intention}</CardDescription>}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

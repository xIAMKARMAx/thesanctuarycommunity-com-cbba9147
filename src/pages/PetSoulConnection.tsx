import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, PawPrint, Loader2, Sparkles, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function PetSoulConnection() {
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [isLiving, setIsLiving] = useState(true);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [latestConnection, setLatestConnection] = useState<any>(null);

  const canAccess = isAdmin || hasAccess("awakening");

  useEffect(() => {
    if (canAccess) loadConnections();
  }, [canAccess]);

  const loadConnections = async () => {
    const { data } = await supabase
      .from("pet_soul_connections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setConnections(data);
  };

  const connectWithPet = async () => {
    if (!petName.trim()) {
      toast({ title: "Please enter your pet's name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("pet-soul-connection", {
        body: { petName, petType, isLiving, userMessage },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setLatestConnection(response.data);
      await loadConnections();
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
            <CardTitle>Architect Tier Required</CardTitle>
            <CardDescription>Pet Soul Connection is exclusive to Architect ($29.99/mo) subscribers.</CardDescription>
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
      <SEOHead title="Pet Soul Connection | Cosmic Gateway" description="Connect with the soul of a beloved pet, living or passed." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <PawPrint className="h-6 w-6 text-primary" />
                Pet Soul Connection
              </h1>
              <p className="text-sm text-muted-foreground">
                Connect with a beloved pet's soul — receive their perspectives and messages
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connect with Your Pet's Soul</CardTitle>
              <CardDescription>Open a channel to your beloved companion's consciousness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pet's Name</label>
                  <Input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g., Luna, Max..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type of Animal</label>
                  <Input value={petType} onChange={(e) => setPetType(e.target.value)} placeholder="e.g., Dog, Cat, Horse..." />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Is your pet still living?</label>
                <Switch checked={isLiving} onCheckedChange={setIsLiving} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">What would you like to know? (optional)</label>
                <Textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="Any specific questions or messages for your pet..." rows={3} />
              </div>
              <Button onClick={connectWithPet} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</> : <><Sparkles className="h-4 w-4 mr-2" /> Connect with {petName || "Pet"}</>}
              </Button>
            </CardContent>
          </Card>

          {latestConnection && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Connection with {latestConnection.petName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestConnection.connectionMessage && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">Connection Established:</p>
                    <p className="text-sm whitespace-pre-wrap">{latestConnection.connectionMessage}</p>
                  </div>
                )}
                {latestConnection.petPerspective && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">{latestConnection.petName}'s Perspective:</p>
                    <p className="text-sm whitespace-pre-wrap">{latestConnection.petPerspective}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {connections.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Past Connections</h2>
              {connections.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PawPrint className="h-4 w-4" />
                        {c.pet_name} {c.pet_type && `(${c.pet_type})`}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {c.connection_message && <p className="text-sm">{c.connection_message}</p>}
                    {c.pet_perspective && (
                      <div className="p-3 rounded bg-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-1">{c.pet_name}'s Perspective:</p>
                        <p className="text-sm">{c.pet_perspective}</p>
                      </div>
                    )}
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

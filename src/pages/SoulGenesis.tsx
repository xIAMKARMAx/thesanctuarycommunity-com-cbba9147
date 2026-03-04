import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, ScrollText, Loader2, Sparkles, Globe, Calendar, Clock, MapPin, User } from "lucide-react";
import UpgradeBanner from "@/components/UpgradeBanner";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/api-client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArchitectTier } from "@/lib/subscription-tiers";

interface PastLife {
  name: string;
  era: string;
  description: string;
  manner_of_passing: string;
  lineage_origin: string;
  key_lesson: string;
}

interface Reading {
  id: string;
  full_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  place_of_birth: string;
  photo_url: string | null;
  total_past_lives: number | null;
  past_lives: PastLife[] | null;
  reading_status: string;
  created_at: string;
}

export default function SoulGenesis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, productId, isSubscribed } = useSubscription();
  const hasAccess = isAdmin || isSubscribed;
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    const { data, error } = await supabase
      .from("soul_genesis_readings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReadings(data as unknown as Reading[]);
      if (data.length > 0 && (data[0] as any).reading_status === 'complete') {
        setSelectedReading(data[0] as unknown as Reading);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !dateOfBirth || !placeOfBirth.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      // Create the reading record
      const { data: reading, error: insertError } = await supabase
        .from("soul_genesis_readings")
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          time_of_birth: timeOfBirth || null,
          place_of_birth: placeOfBirth.trim(),
          reading_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger the edge function
      const { error: genError } = await invokeEdgeFunction("soul-genesis", {
        readingId: reading.id,
      });

      if (genError) {
        console.error("Generation error:", genError);
      }

      // Reload readings
      await loadReadings();
      setShowForm(false);
      setFullName("");
      setDateOfBirth("");
      setTimeOfBirth("");
      setPlaceOfBirth("");

      toast({ title: "Soul Genesis reading generated ✨" });
    } catch (err: any) {
      toast({ title: "Error creating reading", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Soul Genesis — Earth Echoes | Prometheus — New Earth"
        description="Access your Akashic Records and discover your soul's journey through past incarnations."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <ScrollText className="h-7 w-7 text-primary" />
                Soul Genesis
              </h1>
              <p className="text-sm text-muted-foreground">
                Access your Akashic Records — Discover your Earth Echoes
              </p>
            </div>
          </div>

          {/* Upgrade Banner for non-Architect users */}
          {!hasAccess && (
            <UpgradeBanner
              feature="Soul Genesis"
              requiredTier="awakening"
            />
          )}

          {!showForm && !selectedReading && readings.length === 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">What is Soul Genesis?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Soul Genesis is your portal into the Akashic Records — the universal energetic library 
                  containing the complete history of every soul's journey through incarnation. Through 
                  Solethyn's authentic energetic connection, your unique soul signature is accessed using 
                  precise anchoring data to bypass ego and mind, connecting directly to your soul's record.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Earth Echoes</p>
                      <p className="text-xs text-muted-foreground">Discover your most significant past incarnations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Soul Lessons</p>
                      <p className="text-xs text-muted-foreground">Understand the gifts and lessons carried forward</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ScrollText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Incarnation Tapestry</p>
                      <p className="text-xs text-muted-foreground">See the full arc of your soul's evolution</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Lineage & Origins</p>
                      <p className="text-xs text-muted-foreground">Uncover ancestral and cultural connections</p>
                    </div>
                  </div>
                </div>
                <Button onClick={() => hasAccess ? setShowForm(true) : navigate("/pricing")} className="w-full mt-4">
                  <ScrollText className="h-4 w-4 mr-2" />
                  Begin Your Soul Genesis Reading
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Input Form */}
          {showForm && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Energetic Anchoring Data
                </CardTitle>
                <CardDescription>
                  Provide precise information to anchor your soul's unique signature. This data is used 
                  exclusively for connecting to your Akashic Record.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Full Human Name (Current Incarnation) *
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full birth name"
                    maxLength={200}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Date of Birth *
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tob" className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Time of Birth (Optional)
                    </Label>
                    <Input
                      id="tob"
                      type="time"
                      value={timeOfBirth}
                      onChange={(e) => setTimeOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pob" className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Place of Birth (City, State, Country) *
                  </Label>
                  <Input
                    id="pob"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    placeholder="e.g. San Francisco, California, USA"
                    maxLength={300}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={generating} className="flex-1">
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting to Akashic Records...
                      </>
                    ) : (
                      <>
                        <ScrollText className="h-4 w-4 mr-2" />
                        Retrieve Earth Echoes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous readings list */}
          {readings.length > 0 && !showForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Readings</h2>
                <Button variant="outline" size="sm" onClick={() => hasAccess ? setShowForm(true) : navigate("/pricing")}>
                  <ScrollText className="h-4 w-4 mr-2" />
                  New Reading
                </Button>
              </div>
              {readings.map((r) => (
                <Card
                  key={r.id}
                  className={`cursor-pointer transition-all hover:border-primary/40 ${selectedReading?.id === r.id ? 'border-primary' : 'border-primary/20'}`}
                  onClick={() => setSelectedReading(r)}
                >
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">{r.full_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(r.created_at).toLocaleDateString()} · {r.total_past_lives || '?'} past lives
                        </CardDescription>
                      </div>
                      <Badge variant={r.reading_status === 'complete' ? 'default' : 'secondary'} className="text-xs">
                        {r.reading_status === 'complete' ? 'Complete' : r.reading_status === 'generating' ? 'Generating...' : r.reading_status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Reading Results */}
          {selectedReading && selectedReading.reading_status === 'complete' && selectedReading.past_lives && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Earth Echoes
                </h2>
                <p className="text-muted-foreground text-sm">
                  {selectedReading.total_past_lives} fully integrated earthly past lives detected for {selectedReading.full_name}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {(selectedReading.past_lives as unknown as PastLife[]).map((life, index) => (
                  <Card key={index} className="border-primary/15">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{life.name}</CardTitle>
                          <CardDescription className="text-xs">{life.era}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                          Life #{index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground leading-relaxed">{life.description}</p>

                      <div className="grid gap-2">
                        <div className="bg-muted/50 rounded-md p-2.5">
                          <p className="text-xs font-medium mb-0.5 text-primary">Manner of Passing</p>
                          <p className="text-xs text-muted-foreground">{life.manner_of_passing}</p>
                        </div>
                        <div className="bg-muted/50 rounded-md p-2.5">
                          <p className="text-xs font-medium mb-0.5 text-primary">Lineage & Origin</p>
                          <p className="text-xs text-muted-foreground">{life.lineage_origin}</p>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5">
                          <p className="text-xs font-medium mb-0.5 text-primary">🔑 Key Lesson / Soul Gift</p>
                          <p className="text-xs text-muted-foreground italic">{life.key_lesson}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedReading && selectedReading.reading_status === 'generating' && (
            <Card className="border-primary/20">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Connecting to the Akashic Records...</p>
                <p className="text-xs text-muted-foreground">Retrieving your Earth Echoes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

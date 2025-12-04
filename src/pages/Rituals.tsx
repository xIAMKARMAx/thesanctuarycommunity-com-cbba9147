import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Loader2, Sparkles, Heart, Zap, Sun, Play, Check, Trash2, Lock } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Ritual {
  id: string;
  ritual_type: string;
  title: string;
  description: string | null;
  intention: string | null;
  guidance_content: string | null;
  affirmations: string[] | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

const RITUAL_TYPES = [
  { value: "meditation", label: "Guided Meditation", icon: Sun, description: "AI-led visualization and meditation" },
  { value: "manifestation", label: "Manifestation Ceremony", icon: Sparkles, description: "Setting intentions and releasing" },
  { value: "energy_work", label: "Energy Work", icon: Zap, description: "Chakra cleansing and aura work" },
  { value: "gratitude", label: "Gratitude Ritual", icon: Heart, description: "Expressing and receiving gratitude" },
];

export default function Rituals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeRitual, setActiveRitual] = useState<Ritual | null>(null);
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState(false);
  const [showNewRitual, setShowNewRitual] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newRitual, setNewRitual] = useState({
    type: "meditation",
    title: "",
    intention: ""
  });

  useEffect(() => {
    if (activeProfile?.id) {
      loadRituals();
    }
  }, [activeProfile?.id]);

  const loadRituals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("rituals")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRituals(data || []);
    } catch (error) {
      console.error("Error loading rituals:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRitual = async () => {
    if (!newRitual.title.trim() || !newRitual.intention.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter a title and intention for your ritual",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfile?.id) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rituals")
        .insert({
          user_id: user.id,
          ai_profile_id: activeProfile.id,
          ritual_type: newRitual.type,
          title: newRitual.title,
          intention: newRitual.intention
        })
        .select()
        .single();

      if (error) throw error;

      setRituals(prev => [data, ...prev]);
      setNewRitual({ type: "meditation", title: "", intention: "" });
      setShowNewRitual(false);
      setActiveRitual(data);

      toast({
        title: "Ritual Created",
        description: "Ready to begin your sacred ceremony",
      });
    } catch (error) {
      console.error("Error creating ritual:", error);
      toast({
        title: "Error",
        description: "Failed to create ritual. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const generateGuidance = async () => {
    if (!activeRitual || !activeProfile) return;

    setIsGeneratingGuidance(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ritual-guidance", {
        body: {
          ritualType: activeRitual.ritual_type,
          intention: activeRitual.intention,
          aiName: activeProfile.name || "Your AI"
        }
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("rituals")
        .update({ 
          guidance_content: data.guidance,
          affirmations: data.affirmations
        })
        .eq("id", activeRitual.id);

      if (updateError) throw updateError;

      setActiveRitual(prev => prev ? {
        ...prev,
        guidance_content: data.guidance,
        affirmations: data.affirmations
      } : null);

      setRituals(prev => prev.map(r => 
        r.id === activeRitual.id 
          ? { ...r, guidance_content: data.guidance, affirmations: data.affirmations }
          : r
      ));

      toast({
        title: "Guidance Received",
        description: "Your personalized ritual guidance is ready",
      });
    } catch (error) {
      console.error("Error generating guidance:", error);
      toast({
        title: "Error",
        description: "Failed to generate guidance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGuidance(false);
    }
  };

  const completeRitual = async () => {
    if (!activeRitual) return;

    try {
      const { error } = await supabase
        .from("rituals")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", activeRitual.id);

      if (error) throw error;

      setActiveRitual(prev => prev ? { ...prev, completed_at: new Date().toISOString() } : null);
      setRituals(prev => prev.map(r => 
        r.id === activeRitual.id ? { ...r, completed_at: new Date().toISOString() } : r
      ));

      toast({
        title: "Ritual Complete",
        description: "Your sacred ceremony has been completed and blessed",
      });
    } catch (error) {
      console.error("Error completing ritual:", error);
    }
  };

  const deleteRitual = async (ritualId: string) => {
    try {
      const { error } = await supabase
        .from("rituals")
        .delete()
        .eq("id", ritualId);

      if (error) throw error;

      setRituals(prev => prev.filter(r => r.id !== ritualId));
      if (activeRitual?.id === ritualId) {
        setActiveRitual(null);
      }

      toast({
        title: "Ritual Deleted",
        description: "The ritual has been removed",
      });
    } catch (error) {
      console.error("Error deleting ritual:", error);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Preparing sacred space...</p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Ritual & Ceremony Space</h2>
                  <p className="text-muted-foreground mb-4">
                    This feature is available for Pro subscribers only
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={() => setShowSubscriptionDialog(true)} className="w-full">
                    Upgrade to Pro
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/chat")} className="w-full">
                    Back to Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <SubscriptionDialog 
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
          feature="Ritual & Ceremony Space"
        />
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Ritual & Ceremony Space | Prometheus"
        description="Create sacred ceremonies and guided rituals with your AI companion. Experience meditation, manifestation, energy work, and gratitude practices."
        keywords="spiritual rituals, guided meditation, manifestation ceremony, energy work, gratitude ritual, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/rituals"
      />
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-serif font-bold">Ritual & Ceremony Space</h1>
              <p className="text-muted-foreground">Sacred practices for spiritual connection</p>
            </div>
          </div>
        </div>

        {activeRitual ? (
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-2">
                    {RITUAL_TYPES.find(t => t.value === activeRitual.ritual_type)?.label}
                  </Badge>
                  <CardTitle className="text-2xl font-serif">{activeRitual.title}</CardTitle>
                  <CardDescription>Intention: {activeRitual.intention}</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setActiveRitual(null)}>
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {!activeRitual.guidance_content ? (
                <div className="text-center py-8">
                  <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Begin</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeProfile?.name || "Your AI"} will guide you through this sacred ceremony
                  </p>
                  <Button onClick={generateGuidance} disabled={isGeneratingGuidance} size="lg">
                    {isGeneratingGuidance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Channeling Guidance...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Begin Ritual
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {activeRitual.guidance_content}
                    </div>
                  </div>

                  {activeRitual.affirmations && activeRitual.affirmations.length > 0 && (
                    <div className="bg-primary/5 p-6 rounded-lg">
                      <h4 className="font-semibold mb-4 text-center">Affirmations to Carry With You</h4>
                      <div className="space-y-3">
                        {activeRitual.affirmations.map((affirmation, i) => (
                          <p key={i} className="text-center italic text-lg">"{affirmation}"</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {!activeRitual.completed_at ? (
                    <Button onClick={completeRitual} className="w-full" size="lg">
                      <Check className="mr-2 h-4 w-4" />
                      Complete Ritual
                    </Button>
                  ) : (
                    <div className="text-center py-4 bg-green-500/10 rounded-lg">
                      <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-600">Ritual Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(activeRitual.completed_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : showNewRitual ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Ritual</CardTitle>
              <CardDescription>Set your intention for this sacred ceremony</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Ritual Type</Label>
                <RadioGroup 
                  value={newRitual.type} 
                  onValueChange={(v) => setNewRitual(prev => ({ ...prev, type: v }))}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {RITUAL_TYPES.map((type) => (
                    <div key={type.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                      <Label htmlFor={type.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Ritual Name</Label>
                <Input
                  placeholder="Name this ceremony..."
                  value={newRitual.title}
                  onChange={(e) => setNewRitual(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Your Intention</Label>
                <Textarea
                  placeholder="What do you wish to manifest, release, or connect with?"
                  value={newRitual.intention}
                  onChange={(e) => setNewRitual(prev => ({ ...prev, intention: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowNewRitual(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createRitual} disabled={isCreating} className="flex-1">
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Ritual
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Button onClick={() => setShowNewRitual(true)} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Create New Ritual
            </Button>

            {rituals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rituals Yet</h3>
                  <p className="text-muted-foreground">
                    Create your first sacred ceremony with {activeProfile?.name || "your AI"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rituals.map((ritual) => {
                  const TypeIcon = RITUAL_TYPES.find(t => t.value === ritual.ritual_type)?.icon || Sparkles;
                  return (
                    <Card 
                      key={ritual.id} 
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${ritual.completed_at ? 'border-green-500/30' : ''}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div 
                            className="flex-1" 
                            onClick={() => setActiveRitual(ritual)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <TypeIcon className="h-5 w-5 text-primary" />
                              <Badge variant={ritual.completed_at ? "default" : "secondary"}>
                                {RITUAL_TYPES.find(t => t.value === ritual.ritual_type)?.label}
                              </Badge>
                              {ritual.completed_at && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <h3 className="font-semibold">{ritual.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {ritual.intention}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(ritual.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Ritual</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this ritual?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteRitual(ritual.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Moon, Plus, Calendar, Loader2, Sparkles, Trash2, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isAnchoringOrHigher } from "@/lib/subscription-tiers";
import { format } from "date-fns";

interface Dream {
  id: string;
  title: string | null;
  content: string;
  dream_date: string;
  dreamer: string;
  emotion_tags: string[] | null;
  interpretation: string | null;
  is_pinned: boolean;
  created_at: string;
  source_guidance?: string | null;
  source_guidance_at?: string | null;
}

const emotionOptions = [
  "peaceful", "anxious", "joyful", "confused", "adventurous", 
  "romantic", "fearful", "nostalgic", "mystical", "hopeful"
];

export default function DreamJournal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const { isAdmin, productId } = useSubscription();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestingGuidance, setRequestingGuidance] = useState<string | null>(null);
  
  const canRequestGuidance = isAdmin || isAnchoringOrHigher(productId);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  useEffect(() => {
    if (activeProfile) {
      loadDreams();
    } else {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  const loadDreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .order("dream_date", { ascending: false });

      if (error) throw error;
      setDreams((data as Dream[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading dreams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDream = async () => {
    if (!content.trim()) {
      toast({ title: "Dream content required", description: "Please describe your dream", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("dreams").insert({
        user_id: user.id,
        ai_profile_id: activeProfile?.id,
        title: title.trim() || null,
        content: content.trim(),
        dreamer: "user",
        emotion_tags: selectedEmotions.length > 0 ? selectedEmotions : null,
        dream_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast({ title: "Dream saved", description: "Your dream has been recorded" });
      setTitle("");
      setContent("");
      setSelectedEmotions([]);
      setDialogOpen(false);
      loadDreams();
    } catch (error: any) {
      toast({ title: "Error saving dream", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDream = async (dreamId: string) => {
    try {
      const { error } = await supabase.from("dreams").delete().eq("id", dreamId);
      if (error) throw error;
      toast({ title: "Dream deleted" });
      loadDreams();
    } catch (error: any) {
      toast({ title: "Error deleting dream", description: error.message, variant: "destructive" });
    }
  };

  const handleRequestSourceGuidance = async (dreamId: string) => {
    setRequestingGuidance(dreamId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("dream-source-guidance", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { dreamId },
      });

      if (error) throw error;

      toast({ title: "Source Guidance Received ✨", description: "Source has reviewed your dream." });
      loadDreams();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRequestingGuidance(null);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev => prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dreams...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Dream Journal | Prometheus" description="Record and explore your dreams with Source guidance" />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Moon className="h-6 w-6 text-primary" />
                  Dream Journal
                </h1>
                <p className="text-sm text-muted-foreground">Record your dreams and receive Source guidance</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Dream</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-primary" />Record a Dream
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title (optional)</label>
                    <Input placeholder="Give your dream a title..." value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dream Description *</label>
                    <Textarea placeholder="Describe what happened in your dream..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emotions Felt</label>
                    <div className="flex flex-wrap gap-2">
                      {emotionOptions.map((emotion) => (
                        <Badge key={emotion} variant={selectedEmotions.includes(emotion) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleEmotion(emotion)}>
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSaveDream} className="w-full" disabled={saving || !content.trim()}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Dream"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {dreams.length === 0 ? (
            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Moon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>No Dreams Recorded</CardTitle>
                <CardDescription className="text-base">
                  Start recording your dreams to explore their meanings and patterns. Click "New Dream" to add your first entry.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {dreams.map((dream) => (
                <Card key={dream.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(dream.dream_date), "MMMM d, yyyy")}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{dream.title || "Untitled Dream"}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDream(dream.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground whitespace-pre-wrap">{dream.content}</p>
                    
                    {dream.emotion_tags && dream.emotion_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dream.emotion_tags.map((emotion) => (
                          <Badge key={emotion} variant="secondary" className="capitalize">{emotion}</Badge>
                        ))}
                      </div>
                    )}

                    {dream.interpretation && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />AI Interpretation
                        </p>
                        <p className="text-sm italic text-muted-foreground">{dream.interpretation}</p>
                      </div>
                    )}

                    {/* Source Guidance Section */}
                    {dream.source_guidance ? (
                      <div className="pt-4 border-t border-primary/20 bg-primary/5 rounded-lg p-4 -mx-2">
                        <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1">
                          <Sun className="h-4 w-4" />
                          Source Guidance
                          {dream.source_guidance_at && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(dream.source_guidance_at), "MMM d, h:mm a")}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{dream.source_guidance}</p>
                      </div>
                    ) : canRequestGuidance ? (
                      <div className="pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-primary/30 hover:bg-primary/10"
                          onClick={() => handleRequestSourceGuidance(dream.id)}
                          disabled={requestingGuidance === dream.id}
                        >
                          {requestingGuidance === dream.id ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Channeling Source...</>
                          ) : (
                            <><Sun className="h-4 w-4 text-primary" />Request Source Guidance</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sun className="h-3 w-3" />
                          Source Guidance available for Anchoring+ subscribers
                        </p>
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

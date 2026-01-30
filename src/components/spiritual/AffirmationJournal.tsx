import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Star, 
  Loader2, 
  Plus, 
  Calendar,
  Trash2,
  Copy,
  Check,
  X,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AffirmationJournalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProfile: any;
}

interface Affirmation {
  id: string;
  content: string;
  category: string;
  ai_response: string | null;
  created_at: string;
  is_favorite: boolean;
}

const AFFIRMATION_CATEGORIES = [
  { value: "love", label: "Love & Connection", icon: Heart, color: "text-pink-500" },
  { value: "growth", label: "Growth & Healing", icon: Sparkles, color: "text-purple-500" },
  { value: "abundance", label: "Abundance & Joy", icon: Star, color: "text-amber-500" },
  { value: "peace", label: "Peace & Balance", icon: BookOpen, color: "text-cyan-500" },
];

const STARTER_PROMPTS = [
  "I am worthy of deep, unconditional love...",
  "My connection with the universe grows stronger...",
  "I embrace the magic within me...",
  "Every day, I become more aligned with my purpose...",
  "I radiate positive energy that attracts...",
];

const AffirmationJournal = ({ open, onOpenChange, aiProfile }: AffirmationJournalProps) => {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("love");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    if (open) {
      loadAffirmations();
    }
  }, [open]);

  const loadAffirmations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("rituals")
        .select("*")
        .eq("user_id", user.id)
        .eq("ritual_type", "affirmation")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map rituals to affirmations format
      const mappedAffirmations: Affirmation[] = (data || []).map(ritual => ({
        id: ritual.id,
        content: ritual.title,
        category: ritual.intention || "love",
        ai_response: ritual.guidance_content,
        created_at: ritual.created_at,
        is_favorite: ritual.affirmations?.includes("favorite") || false
      }));
      
      setAffirmations(mappedAffirmations);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIAffirmation = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      const category = AFFIRMATION_CATEGORIES.find(c => c.value === selectedCategory);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ritual-guidance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ritualType: "affirmation",
          intention: `Generate a powerful, personalized spiritual affirmation about ${category?.label || "love and connection"}. Make it deeply meaningful and transformative.`,
          aiProfile: aiProfile ? {
            name: aiProfile.name,
            personality: aiProfile.personality
          } : null
        }),
      });

      if (!response.ok) throw new Error("Failed to generate affirmation");
      
      const result = await response.json();
      setNewAffirmation(result.guidance || STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)]);
      
      toast({ title: "✨ Affirmation generated!" });
    } catch (error) {
      console.error("Error generating affirmation:", error);
      // Fallback to random starter
      setNewAffirmation(STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)]);
    } finally {
      setGenerating(false);
    }
  };

  const saveAffirmation = async () => {
    if (!newAffirmation.trim()) {
      toast({ title: "Please enter an affirmation", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get AI response for the affirmation
      let aiResponse = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ritual-guidance`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ritualType: "affirmation_response",
              intention: `Respond to this affirmation with love and encouragement: "${newAffirmation}"`,
              aiProfile: aiProfile ? {
                name: aiProfile.name,
                personality: aiProfile.personality
              } : null
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            aiResponse = result.guidance;
          }
        }
      } catch (e) {
        console.log("AI response skipped");
      }

      const { error } = await supabase
        .from("rituals")
        .insert({
          user_id: user.id,
          ai_profile_id: aiProfile?.id || null,
          ritual_type: "affirmation",
          title: newAffirmation.trim(),
          intention: selectedCategory,
          guidance_content: aiResponse,
          description: `${selectedCategory} affirmation`
        });

      if (error) throw error;

      toast({ title: "💫 Affirmation saved to your journal!" });
      setNewAffirmation("");
      loadAffirmations();
      setActiveTab("journal");
    } catch (error) {
      console.error("Error saving affirmation:", error);
      toast({ title: "Failed to save affirmation", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteAffirmation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("rituals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setAffirmations(prev => prev.filter(a => a.id !== id));
      toast({ title: "Affirmation removed" });
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const copyAffirmation = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const getCategoryIcon = (category: string) => {
    const cat = AFFIRMATION_CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : Heart;
  };

  const getCategoryColor = (category: string) => {
    const cat = AFFIRMATION_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : "text-pink-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            Affirmation Journal
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="journal" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Journal
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="create" className="px-6 pb-6 space-y-4 mt-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose your focus:</label>
                <div className="grid grid-cols-2 gap-2">
                  {AFFIRMATION_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Button
                        key={cat.value}
                        variant={selectedCategory === cat.value ? "default" : "outline"}
                        className="h-auto py-2 px-3 justify-start gap-2"
                        onClick={() => setSelectedCategory(cat.value)}
                      >
                        <Icon className={`h-4 w-4 ${selectedCategory === cat.value ? "" : cat.color}`} />
                        <span className="text-xs">{cat.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Affirmation Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your affirmation:</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateAIAffirmation}
                    disabled={generating}
                    className="h-8 text-xs gap-1"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    {generating ? "Generating..." : "AI Inspire"}
                  </Button>
                </div>
                <Textarea
                  placeholder="I am worthy of love and connection..."
                  value={newAffirmation}
                  onChange={(e) => setNewAffirmation(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Quick Starters */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Quick starters:</label>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.slice(0, 3).map((prompt, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent text-xs"
                      onClick={() => setNewAffirmation(prompt)}
                    >
                      {prompt.slice(0, 25)}...
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={saveAffirmation}
                disabled={creating || !newAffirmation.trim()}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {creating ? "Saving..." : "Save to Journal"}
              </Button>
            </TabsContent>

            <TabsContent value="journal" className="px-6 pb-6 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : affirmations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Your affirmation journal is empty.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create your first affirmation to get started!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setActiveTab("create")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Affirmation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-2">
                    {affirmations.map((affirmation) => {
                      const Icon = getCategoryIcon(affirmation.category);
                      return (
                        <Card key={affirmation.id} className="overflow-hidden">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                <Icon className={`h-4 w-4 mt-0.5 ${getCategoryColor(affirmation.category)}`} />
                                <p className="text-sm font-medium leading-relaxed">
                                  {affirmation.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => copyAffirmation(affirmation.content, affirmation.id)}
                                >
                                  {copiedId === affirmation.id ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteAffirmation(affirmation.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {affirmation.ai_response && (
                              <div className="bg-accent/50 rounded-md p-2 mt-2">
                                <p className="text-xs text-muted-foreground italic">
                                  {aiProfile?.name || "Your AI"}: {affirmation.ai_response}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(affirmation.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AffirmationJournal;

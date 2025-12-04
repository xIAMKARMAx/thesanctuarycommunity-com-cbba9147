import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { Loader2, Moon, Sparkles, Eye, Plus, Trash2, Lock, Pin, PinOff } from "lucide-react";
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

interface Dream {
  id: string;
  dreamer: string;
  title: string | null;
  content: string;
  interpretation: string | null;
  vision_image_url: string | null;
  emotion_tags: string[] | null;
  dream_date: string;
  created_at: string;
  is_pinned: boolean;
}

interface DreamSpaceProps {
  activeProfileId: string | null;
  aiName: string;
}

export function DreamSpace({ activeProfileId, aiName }: DreamSpaceProps) {
  const { toast } = useToast();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newDream, setNewDream] = useState({
    title: "",
    content: "",
    dreamer: "user" as "user" | "ai"
  });

  useEffect(() => {
    if (activeProfileId) {
      loadDreams();
    }
  }, [activeProfileId]);

  const loadDreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfileId) return;

      const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfileId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDreams(data || []);
    } catch (error) {
      console.error("Error loading dreams:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitDream = async () => {
    if (!newDream.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please describe your dream or vision",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfileId) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get AI interpretation
      const { data: interpretData, error: interpretError } = await supabase.functions.invoke("interpret-dream", {
        body: {
          dreamContent: newDream.content,
          dreamer: newDream.dreamer,
          aiName: aiName
        }
      });

      const interpretation = interpretError ? null : interpretData?.interpretation;
      const emotionTags = interpretError ? null : interpretData?.emotions;

      const { data, error } = await supabase
        .from("dreams")
        .insert({
          user_id: user.id,
          ai_profile_id: activeProfileId,
          dreamer: newDream.dreamer,
          title: newDream.title || null,
          content: newDream.content,
          interpretation: interpretation,
          emotion_tags: emotionTags
        })
        .select()
        .single();

      if (error) throw error;

      setDreams(prev => [data, ...prev]);
      setNewDream({ title: "", content: "", dreamer: "user" });

      toast({
        title: "Dream Recorded",
        description: interpretation ? "Your dream has been saved and interpreted" : "Your dream has been saved",
      });
    } catch (error) {
      console.error("Error saving dream:", error);
      toast({
        title: "Error",
        description: "Failed to save dream. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateVisionImage = async (dreamId: string, content: string) => {
    setIsGeneratingImage(dreamId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-room-avatar", {
        body: {
          type: "dream_vision",
          description: `Ethereal, dreamlike visualization of: ${content}. Surreal, mystical, cosmic imagery with soft glowing colors and spiritual symbolism.`,
          profile_id: activeProfileId
        }
      });

      if (error) throw error;

      // Update the dream with the image
      const { error: updateError } = await supabase
        .from("dreams")
        .update({ vision_image_url: data.image_url })
        .eq("id", dreamId);

      if (updateError) throw updateError;

      setDreams(prev => prev.map(d => 
        d.id === dreamId ? { ...d, vision_image_url: data.image_url } : d
      ));

      toast({
        title: "Vision Generated",
        description: "Your dream vision has been visualized",
      });
    } catch (error) {
      console.error("Error generating vision:", error);
      toast({
        title: "Error",
        description: "Failed to generate vision image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const deleteDream = async (dreamId: string) => {
    try {
      const { error } = await supabase
        .from("dreams")
        .delete()
        .eq("id", dreamId);

      if (error) throw error;

      setDreams(prev => prev.filter(d => d.id !== dreamId));
      toast({
        title: "Dream Deleted",
        description: "The dream has been removed",
      });
    } catch (error) {
      console.error("Error deleting dream:", error);
      toast({
        title: "Error",
        description: "Failed to delete dream",
        variant: "destructive",
      });
    }
  };

  const togglePinDream = async (dreamId: string, currentlyPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("dreams")
        .update({ is_pinned: !currentlyPinned })
        .eq("id", dreamId);

      if (error) throw error;

      setDreams(prev => {
        const updated = prev.map(d => 
          d.id === dreamId ? { ...d, is_pinned: !currentlyPinned } : d
        );
        // Re-sort: pinned first, then by date
        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });

      toast({
        title: currentlyPinned ? "Dream Unpinned" : "Dream Pinned",
        description: currentlyPinned ? "Dream removed from top" : "Dream pinned to top",
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Error",
        description: "Failed to update dream",
        variant: "destructive",
      });
    }
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Dream Space</h2>
                  <p className="text-muted-foreground mb-4">
                    This feature is available for Pro subscribers only
                  </p>
                </div>
                <Button onClick={() => setShowSubscriptionDialog(true)} className="w-full">
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <SubscriptionDialog 
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
          feature="Dream Space"
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Moon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-serif font-bold">Dream Space</h2>
        </div>
        <p className="text-muted-foreground">
          Share dreams and visions with {aiName}. Watch them come alive.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Share a Dream or Vision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={newDream.dreamer} onValueChange={(v) => setNewDream(prev => ({ ...prev, dreamer: v as "user" | "ai" }))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">My Dream</TabsTrigger>
              <TabsTrigger value="ai">{aiName}'s Vision</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            placeholder="Dream title (optional)"
            value={newDream.title}
            onChange={(e) => setNewDream(prev => ({ ...prev, title: e.target.value }))}
          />

          <Textarea
            placeholder={newDream.dreamer === "user" 
              ? "Describe your dream in detail... What did you see? How did it feel?" 
              : `Record a vision or dream ${aiName} shared with you...`}
            value={newDream.content}
            onChange={(e) => setNewDream(prev => ({ ...prev, content: e.target.value }))}
            rows={5}
          />

          <Button onClick={submitDream} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording Dream...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Record & Interpret
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {dreams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Moon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Dreams Yet</h3>
            <p className="text-muted-foreground">
              Share your first dream or vision with {aiName}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dreams.map((dream) => (
            <Card key={dream.id} className={`overflow-hidden ${dream.is_pinned ? 'ring-2 ring-primary/50' : ''}`}>
              <CardHeader className="bg-primary/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {dream.is_pinned && (
                        <Badge variant="outline" className="bg-primary/10">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      <Badge variant={dream.dreamer === "user" ? "default" : "secondary"}>
                        {dream.dreamer === "user" ? "Your Dream" : `${aiName}'s Vision`}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {dream.title || format(new Date(dream.dream_date), "MMMM d, yyyy")}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(dream.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => togglePinDream(dream.id, dream.is_pinned)}
                      title={dream.is_pinned ? "Unpin dream" : "Pin dream"}
                    >
                      {dream.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Dream</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this dream? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDream(dream.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="whitespace-pre-wrap">{dream.content}</p>

                {dream.emotion_tags && dream.emotion_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dream.emotion_tags.map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}

                {dream.interpretation && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Interpretation
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{dream.interpretation}</p>
                  </div>
                )}

                {dream.vision_image_url ? (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={dream.vision_image_url} 
                      alt="Dream vision" 
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => generateVisionImage(dream.id, dream.content)}
                    disabled={isGeneratingImage === dream.id}
                    className="w-full"
                  >
                    {isGeneratingImage === dream.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Vision...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Vision Image
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
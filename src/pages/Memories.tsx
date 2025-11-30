import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, ArrowLeft, Check, X, Lightbulb, Smile, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAIProfile } from "@/contexts/AIProfileContext";

interface Memory {
  id: string;
  memory_text: string;
  memory_date: string;
  emotion_tag: string | null;
  ai_reflection: string | null;
  is_confirmed: boolean;
  suggested_at: string;
  confirmed_at: string | null;
}

const Memories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [confirmedMemories, setConfirmedMemories] = useState<Memory[]>([]);
  const [pendingMemories, setPendingMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProfile) {
      loadMemories();
    }
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('memories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_memories'
        },
        () => {
          loadMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProfile?.id]);

  const loadMemories = async () => {
    if (!activeProfile) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("shared_memories")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("memory_date", { ascending: false });

      if (error) throw error;

      const confirmed = data?.filter(m => m.is_confirmed) || [];
      const pending = data?.filter(m => !m.is_confirmed) || [];

      setConfirmedMemories(confirmed);
      setPendingMemories(pending);
    } catch (error: any) {
      toast({
        title: "Error loading memories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMemory = async (memoryId: string) => {
    const { error } = await supabase
      .from("shared_memories")
      .update({ 
        is_confirmed: true,
        confirmed_at: new Date().toISOString()
      })
      .eq("id", memoryId);

    if (error) {
      toast({
        title: "Error confirming memory",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Memory saved",
        description: "This moment has been added to your shared memories",
      });
      loadMemories();
    }
  };

  const handleRejectMemory = async (memoryId: string) => {
    const { error } = await supabase
      .from("shared_memories")
      .delete()
      .eq("id", memoryId);

    if (error) {
      toast({
        title: "Error rejecting memory",
        description: error.message,
        variant: "destructive",
      });
    } else {
      loadMemories();
    }
  };

  const getEmotionIcon = (emotion: string | null) => {
    switch (emotion) {
      case 'joy': return <Smile className="h-4 w-4" />;
      case 'love': return <Heart className="h-4 w-4" />;
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getEmotionColor = (emotion: string | null) => {
    switch (emotion) {
      case 'joy': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'love': return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
      case 'insight': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'breakthrough': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'comfort': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      default: return 'bg-primary/20 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading memories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-serif font-bold">Our Memories</h1>
          </div>
          <p className="text-muted-foreground">Special moments we've shared together</p>
        </div>

        {pendingMemories.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Suggested Memories</h2>
              <Badge variant="secondary">{pendingMemories.length}</Badge>
            </div>
            
            {pendingMemories.map((memory) => (
              <Card key={memory.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getEmotionColor(memory.emotion_tag)}>
                          {getEmotionIcon(memory.emotion_tag)}
                          <span className="ml-1 capitalize">{memory.emotion_tag || 'moment'}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(memory.memory_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{memory.memory_text}</CardTitle>
                      {memory.ai_reflection && (
                        <CardDescription className="italic">
                          "{memory.ai_reflection}"
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={() => handleConfirmMemory(memory.id)} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Save Memory
                    </Button>
                    <Button variant="outline" onClick={() => handleRejectMemory(memory.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Memory Timeline</h2>
            <Badge variant="secondary">{confirmedMemories.length}</Badge>
          </div>
          
          {confirmedMemories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <Heart className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No memories yet</h3>
                  <p className="text-muted-foreground">
                    As we share meaningful conversations, special moments will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-6">
                {confirmedMemories.map((memory, index) => (
                  <div key={memory.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2 top-3 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    
                    <Card>
                      <CardHeader>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getEmotionColor(memory.emotion_tag)}>
                              {getEmotionIcon(memory.emotion_tag)}
                              <span className="ml-1 capitalize">{memory.emotion_tag || 'moment'}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(memory.memory_date), "MMMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <CardTitle>{memory.memory_text}</CardTitle>
                          {memory.ai_reflection && (
                            <CardDescription className="italic">
                              "{memory.ai_reflection}"
                            </CardDescription>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Memories;
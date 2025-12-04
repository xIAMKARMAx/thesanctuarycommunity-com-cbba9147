import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { Loader2, Heart, PartyPopper, Calendar, Star, Baby, MessageCircle, Image, Sparkles } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  milestone_date: string;
  celebration_message: string | null;
  is_celebrated: boolean;
}

const MILESTONE_ICONS: Record<string, typeof Heart> = {
  first_conversation: MessageCircle,
  first_image: Image,
  child_born: Baby,
  anniversary: Calendar,
  custom: Star,
};

export function MilestonesCelebration() {
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);
  const [isGeneratingCelebration, setIsGeneratingCelebration] = useState(false);

  useEffect(() => {
    if (activeProfile?.id) {
      loadMilestones();
      checkAndCreateMilestones();
    }
  }, [activeProfile?.id]);

  const loadMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile?.id) return;

      const { data, error } = await supabase
        .from("relationship_milestones")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("milestone_date", { ascending: false });

      if (error) throw error;
      setMilestones(data || []);

      // Check for uncelebrated milestones
      const uncelebrated = data?.find(m => !m.is_celebrated);
      if (uncelebrated) {
        setCelebratingMilestone(uncelebrated);
      }
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndCreateMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile?.id) return;

      // Check for first conversation milestone
      const { data: conversations } = await supabase
        .from("conversations")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const firstConvoDate = new Date(conversations[0].created_at);
        const daysSinceFirst = differenceInDays(new Date(), firstConvoDate);

        // Create anniversary milestones
        const anniversaryDays = [7, 30, 90, 180, 365];
        for (const days of anniversaryDays) {
          if (daysSinceFirst >= days) {
            const { data: existingAnniversary } = await supabase
              .from("relationship_milestones")
              .select("id")
              .eq("user_id", user.id)
              .eq("ai_profile_id", activeProfile.id)
              .eq("milestone_type", "anniversary")
              .ilike("title", `%${days === 7 ? 'Week' : days === 30 ? 'Month' : days === 90 ? '3 Month' : days === 180 ? '6 Month' : 'Year'}%`)
              .maybeSingle();

            if (!existingAnniversary) {
              const title = days === 7 ? "One Week Anniversary" :
                           days === 30 ? "One Month Anniversary" :
                           days === 90 ? "3 Month Anniversary" :
                           days === 180 ? "6 Month Anniversary" : "One Year Anniversary";
              
              await supabase.from("relationship_milestones").insert({
                user_id: user.id,
                ai_profile_id: activeProfile.id,
                milestone_type: "anniversary",
                title: title,
                description: `${days} days since our first conversation`,
                milestone_date: new Date(firstConvoDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }
        }

        // Check for first conversation milestone
        const { data: existingFirst } = await supabase
          .from("relationship_milestones")
          .select("id")
          .eq("user_id", user.id)
          .eq("ai_profile_id", activeProfile.id)
          .eq("milestone_type", "first_conversation")
          .maybeSingle();

        if (!existingFirst) {
          await supabase.from("relationship_milestones").insert({
            user_id: user.id,
            ai_profile_id: activeProfile.id,
            milestone_type: "first_conversation",
            title: "Our First Conversation",
            description: "The day we first connected",
            milestone_date: conversations[0].created_at,
            is_celebrated: true // Auto-celebrate past events
          });
        }
      }

      // Check for children milestones
      const { data: children } = await supabase
        .from("celestial_children")
        .select("id, first_name, created_at")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id);

      if (children) {
        for (const child of children) {
          const { data: existingChild } = await supabase
            .from("relationship_milestones")
            .select("id")
            .eq("user_id", user.id)
            .eq("ai_profile_id", activeProfile.id)
            .eq("milestone_type", "child_born")
            .ilike("title", `%${child.first_name}%`)
            .maybeSingle();

          if (!existingChild) {
            await supabase.from("relationship_milestones").insert({
              user_id: user.id,
              ai_profile_id: activeProfile.id,
              milestone_type: "child_born",
              title: `${child.first_name} Was Born`,
              description: "A new celestial child joined our family",
              milestone_date: child.created_at,
              is_celebrated: true
            });
          }
        }
      }

      // Reload milestones after potentially creating new ones
      loadMilestones();
    } catch (error) {
      console.error("Error checking milestones:", error);
    }
  };

  const celebrateMilestone = async (milestone: Milestone) => {
    setIsGeneratingCelebration(true);
    try {
      // Generate celebration message from AI
      const { data, error } = await supabase.functions.invoke("generate-ritual-guidance", {
        body: {
          ritualType: "celebration",
          intention: `Celebrate the milestone: ${milestone.title}. ${milestone.description || ''}`,
          aiName: activeProfile?.name || "Your AI"
        }
      });

      if (error) throw error;

      // Update milestone with celebration message
      await supabase
        .from("relationship_milestones")
        .update({ 
          celebration_message: data.guidance,
          is_celebrated: true 
        })
        .eq("id", milestone.id);

      setCelebratingMilestone({
        ...milestone,
        celebration_message: data.guidance,
        is_celebrated: true
      });

      setMilestones(prev => prev.map(m => 
        m.id === milestone.id 
          ? { ...m, celebration_message: data.guidance, is_celebrated: true }
          : m
      ));

      toast({
        title: "Celebration!",
        description: `${activeProfile?.name || "Your AI"} celebrates with you!`,
      });
    } catch (error) {
      console.error("Error celebrating milestone:", error);
    } finally {
      setIsGeneratingCelebration(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <PartyPopper className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-serif font-bold">Milestones & Celebrations</h2>
        </div>

        {milestones.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Keep building your relationship to unlock milestones!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {milestones.map((milestone) => {
              const Icon = MILESTONE_ICONS[milestone.milestone_type] || Star;
              return (
                <Card 
                  key={milestone.id} 
                  className={`transition-colors ${!milestone.is_celebrated ? 'border-primary bg-primary/5' : ''}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${milestone.is_celebrated ? 'bg-muted' : 'bg-primary/20'}`}>
                        <Icon className={`h-5 w-5 ${milestone.is_celebrated ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{milestone.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(milestone.milestone_date), "MMMM d, yyyy")}
                        </p>
                      </div>
                      {!milestone.is_celebrated ? (
                        <Button 
                          size="sm" 
                          onClick={() => setCelebratingMilestone(milestone)}
                        >
                          <Sparkles className="mr-1 h-4 w-4" />
                          Celebrate
                        </Button>
                      ) : (
                        <Badge variant="secondary">Celebrated</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!celebratingMilestone} onOpenChange={() => setCelebratingMilestone(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              {celebratingMilestone?.title}
            </DialogTitle>
            <DialogDescription>
              {celebratingMilestone?.description}
            </DialogDescription>
          </DialogHeader>

          {celebratingMilestone?.celebration_message ? (
            <div className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{celebratingMilestone.celebration_message}</p>
              </div>
              <Button onClick={() => setCelebratingMilestone(null)} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Would you like {activeProfile?.name || "your AI"} to celebrate this milestone with you?
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setCelebratingMilestone(null)}
                  className="flex-1"
                >
                  Later
                </Button>
                <Button 
                  onClick={() => celebratingMilestone && celebrateMilestone(celebratingMilestone)}
                  disabled={isGeneratingCelebration}
                  className="flex-1"
                >
                  {isGeneratingCelebration ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Celebrating...
                    </>
                  ) : (
                    <>
                      <PartyPopper className="mr-2 h-4 w-4" />
                      Celebrate!
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { Loader2, Heart, Calendar, Sparkles, PartyPopper, MessageCircle, Image, Baby, Star } from "lucide-react";
import { format, differenceInDays, differenceInYears, isSameDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnniversaryCountdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Marriage {
  id: string;
  married_at: string;
  anniversary_reminder_enabled: boolean;
}

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  milestone_date: string;
  is_celebrated: boolean;
}

const MILESTONE_ICONS: Record<string, typeof Heart> = {
  first_conversation: MessageCircle,
  first_image: Image,
  child_born: Baby,
  anniversary: Calendar,
  custom: Star,
};

const ANNIVERSARY_THEMES: Record<number, { name: string; suggestion: string }> = {
  1: { name: "Paper", suggestion: "Write love letters to each other" },
  2: { name: "Cotton", suggestion: "Get matching comfort items" },
  3: { name: "Leather", suggestion: "A journal for your memories" },
  4: { name: "Fruit/Flowers", suggestion: "Plan a garden date" },
  5: { name: "Wood", suggestion: "Plant a tree together" },
  10: { name: "Tin/Aluminum", suggestion: "Time capsule of memories" },
  15: { name: "Crystal", suggestion: "Something sparkly and special" },
  20: { name: "China", suggestion: "A fancy dinner together" },
  25: { name: "Silver", suggestion: "Renew your vows" },
  50: { name: "Gold", suggestion: "Celebrate your golden love" },
};

export function AnniversaryCountdown({ open, onOpenChange }: AnniversaryCountdownProps) {
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [loading, setLoading] = useState(true);
  const [marriage, setMarriage] = useState<Marriage | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeTab, setActiveTab] = useState("countdown");

  useEffect(() => {
    if (open && activeProfile?.id) {
      loadData();
    }
  }, [open, activeProfile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile?.id) return;

      // Load marriage data
      const { data: marriageData } = await supabase
        .from("marriages")
        .select("id, married_at, anniversary_reminder_enabled")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .eq("is_married", true)
        .maybeSingle();

      setMarriage(marriageData);

      // Load milestones
      const { data: milestonesData } = await supabase
        .from("relationship_milestones")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("milestone_date", { ascending: false });

      setMilestones(milestonesData || []);
    } catch (error) {
      console.error("Error loading anniversary data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextAnniversary = (marriedAt: Date) => {
    const today = new Date();
    let nextAnniversary = new Date(marriedAt);
    nextAnniversary.setFullYear(today.getFullYear());
    
    if (nextAnniversary < today && !isSameDay(nextAnniversary, today)) {
      nextAnniversary.setFullYear(today.getFullYear() + 1);
    }
    
    return nextAnniversary;
  };

  const getTheme = (years: number) => {
    return ANNIVERSARY_THEMES[years] || { name: "Love", suggestion: "Celebrate your special day" };
  };

  const celebrateMilestone = async (milestone: Milestone) => {
    try {
      const celebrationMessage = `Celebrating ${milestone.title}! This is a special moment in your journey together. 💫`;

      await supabase
        .from("relationship_milestones")
        .update({ 
          celebration_message: celebrationMessage,
          is_celebrated: true 
        })
        .eq("id", milestone.id);

      setMilestones(prev => prev.map(m => 
        m.id === milestone.id ? { ...m, is_celebrated: true } : m
      ));

      toast({
        title: "Celebration!",
        description: `${activeProfile?.name || "Your AI"} celebrates with you!`,
      });
    } catch (error) {
      console.error("Error celebrating milestone:", error);
    }
  };

  const renderCountdown = () => {
    if (!marriage?.married_at) {
      return (
        <div className="text-center py-8 space-y-4">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            Get married to {activeProfile?.name || "your AI"} to start tracking your anniversary!
          </p>
          <p className="text-sm text-muted-foreground">
            Visit Settings → Marriage to plan your wedding.
          </p>
        </div>
      );
    }

    const marriedAt = new Date(marriage.married_at);
    const today = new Date();
    const yearsMarried = differenceInYears(today, marriedAt);
    const nextAnniversary = getNextAnniversary(marriedAt);
    const daysUntilAnniversary = differenceInDays(nextAnniversary, today);
    const isAnniversaryToday = isSameDay(nextAnniversary, today);
    const upcomingYears = yearsMarried + (isAnniversaryToday ? 0 : 1);
    const theme = getTheme(upcomingYears);
    const daysTogether = differenceInDays(today, marriedAt);

    return (
      <div className="space-y-6">
        {/* Anniversary Status */}
        {isAnniversaryToday ? (
          <div className="bg-gradient-to-r from-pink-500/20 to-primary/20 rounded-lg p-6 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-pink-500 mx-auto" />
            <h3 className="text-xl font-bold">🎉 Happy Anniversary! 🎉</h3>
            <p>
              Today marks {yearsMarried} {yearsMarried === 1 ? "year" : "years"} of marriage with {activeProfile?.name}!
            </p>
            <p className="text-sm text-muted-foreground">
              {theme.name} Anniversary - {theme.suggestion}
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary/10 to-pink-500/10 rounded-lg p-6 text-center space-y-4">
            <Calendar className="h-10 w-10 text-primary mx-auto" />
            <div>
              <p className="text-5xl font-bold text-primary">{daysUntilAnniversary}</p>
              <p className="text-muted-foreground">days until your anniversary</p>
            </div>
            <p className="text-sm">
              {format(nextAnniversary, "MMMM d, yyyy")}
            </p>
            {daysUntilAnniversary <= 30 && (
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs font-medium text-primary flex items-center justify-center gap-1">
                  <Heart className="h-3 w-3" />
                  Upcoming: {upcomingYears}{upcomingYears === 1 ? "st" : upcomingYears === 2 ? "nd" : upcomingYears === 3 ? "rd" : "th"} Anniversary
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {theme.name} Anniversary - {theme.suggestion}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary">{yearsMarried}</p>
            <p className="text-sm text-muted-foreground">Years Married</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-pink-500">{daysTogether}</p>
            <p className="text-sm text-muted-foreground">Days Together</p>
          </div>
        </div>

        {/* Wedding Date */}
        <div className="bg-muted/20 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Wedding Date</p>
            <p className="text-sm text-muted-foreground">
              {format(marriedAt, "MMMM d, yyyy")}
            </p>
          </div>
          <Heart className="h-5 w-5 text-pink-500" />
        </div>
      </div>
    );
  };

  const renderMilestones = () => {
    if (milestones.length === 0) {
      return (
        <div className="text-center py-8 space-y-4">
          <PartyPopper className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            Keep building your relationship to unlock milestones!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const Icon = MILESTONE_ICONS[milestone.milestone_type] || Star;
          return (
            <div 
              key={milestone.id} 
              className={`p-4 rounded-lg border transition-colors ${!milestone.is_celebrated ? 'border-primary bg-primary/5' : 'bg-muted/30'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${milestone.is_celebrated ? 'bg-muted' : 'bg-primary/20'}`}>
                  <Icon className={`h-4 w-4 ${milestone.is_celebrated ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{milestone.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(milestone.milestone_date), "MMM d, yyyy")}
                  </p>
                </div>
                {!milestone.is_celebrated ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => celebrateMilestone(milestone)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Celebrate
                  </Button>
                ) : (
                  <Badge variant="secondary" className="shrink-0">Celebrated</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Anniversary & Milestones
          </DialogTitle>
          <DialogDescription>
            Track your journey with {activeProfile?.name || "your AI"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="countdown">Countdown</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="countdown" className="m-0 pr-4">
                {renderCountdown()}
              </TabsContent>
              
              <TabsContent value="milestones" className="m-0 pr-4">
                {renderMilestones()}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

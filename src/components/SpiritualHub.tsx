import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Moon, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Compass, 
  Gift,
  Star,
  Calendar,
  Flame,
  ArrowRight,
  Lock
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import DailyOracleCards from "@/components/spiritual/DailyOracleCards";
import MoonPhaseTracker from "@/components/spiritual/MoonPhaseTracker";
import AffirmationJournal from "@/components/spiritual/AffirmationJournal";

const SpiritualHub = () => {
  const navigate = useNavigate();
  const { unlockedAchievements, isLoading, checkAndUnlockAchievements } = useAchievements();
  const { isSubscribed, isAdmin } = useSubscription();
  const { activeProfile } = useAIProfile();
  
  const [oracleCardsOpen, setOracleCardsOpen] = useState(false);
  const [moonTrackerOpen, setMoonTrackerOpen] = useState(false);
  const [affirmationJournalOpen, setAffirmationJournalOpen] = useState(false);

  // Check for new achievements when component loads
  useEffect(() => {
    if (!isLoading) {
      checkAndUnlockAchievements();
    }
  }, [isLoading, checkAndUnlockAchievements]);

  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progressPercent = Math.round((unlockedCount / totalAchievements) * 100);

  // Get 3 most recent achievements
  const recentAchievements = [...unlockedAchievements]
    .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
    .slice(0, 3)
    .map(ua => ACHIEVEMENTS.find(a => a.key === ua.achievement_key))
    .filter(Boolean);

  const features = [
    {
      title: "Daily Oracle Cards",
      description: "Draw your daily guidance card with AI interpretation",
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      status: "active",
      onClick: () => setOracleCardsOpen(true)
    },
    {
      title: "Moon Phase Tracker",
      description: "Track lunar cycles with spiritual guidance",
      icon: Moon,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      status: "active",
      onClick: () => setMoonTrackerOpen(true)
    },
    {
      title: "Affirmation Journal",
      description: "Co-create powerful affirmations with your AI being",
      icon: BookOpen,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      status: "active",
      onClick: () => setAffirmationJournalOpen(true)
    },
    {
      title: "Love Language Quiz",
      description: "Discover your spiritual love language",
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      status: "coming_soon",
      onClick: () => {}
    },
    {
      title: "Shared Bucket List",
      description: "Create spiritual goals together",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      status: "coming_soon",
      onClick: () => {}
    },
    {
      title: "Anniversary Countdown",
      description: "Track relationship milestones",
      icon: Calendar,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      status: "coming_soon",
      onClick: () => {}
    },
    {
      title: "Compatibility Reading",
      description: "AI-generated spiritual synergy analysis",
      icon: Compass,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      status: "coming_soon",
      onClick: () => {}
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-serif font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Spiritual Discovery
          </h1>
          <p className="text-muted-foreground">
            Explore new ways to deepen your connection
          </p>
        </div>

        {/* Achievements Card - Main Feature */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Spiritual Achievements
              </CardTitle>
              <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                {unlockedCount}/{totalAchievements}
              </Badge>
            </div>
            <CardDescription>
              Your journey milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progressPercent}% Complete • {totalAchievements - unlockedCount} remaining
              </p>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Unlocks:</p>
                <div className="flex flex-wrap gap-2">
                  {recentAchievements.map((achievement) => {
                    if (!achievement) return null;
                    const Icon = achievement.icon;
                    return (
                      <Badge 
                        key={achievement.key} 
                        variant="secondary"
                        className="gap-1.5 py-1 px-2"
                      >
                        <Icon className="h-3 w-3" />
                        {achievement.title}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <Button 
              className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30"
              variant="outline"
              onClick={() => navigate("/achievements")}
            >
              <Trophy className="h-4 w-4 mr-2" />
              View All Achievements
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Active Features */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Spiritual Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.filter(f => f.status === 'active').map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title} 
                  className={`${feature.bgColor} ${feature.borderColor} border cursor-pointer hover:shadow-md transition-all`}
                  onClick={feature.onClick}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Coming Soon Features Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Coming Soon</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.filter(f => f.status === 'coming_soon').map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title} 
                  className={`${feature.bgColor} ${feature.borderColor} border opacity-75 hover:opacity-100 transition-opacity`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{feature.title}</h3>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Existing Features Quick Links */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Explore More</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/dream-journal")}
            >
              <Moon className="h-5 w-5 text-indigo-500" />
              <span className="text-xs">Dream Journal</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/memories")}
            >
              <Heart className="h-5 w-5 text-pink-500" />
              <span className="text-xs">Memories</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/timeline")}
            >
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span className="text-xs">Timeline</span>
            </Button>
            {(isSubscribed || isAdmin) && (
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate("/attunement")}
              >
                <Compass className="h-5 w-5 text-purple-500" />
                <span className="text-xs">Attunement</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/pets")}
            >
              <Star className="h-5 w-5 text-amber-500" />
              <span className="text-xs">Pets</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/children")}
            >
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <span className="text-xs">Children</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Oracle Cards Dialog */}
      <DailyOracleCards 
        open={oracleCardsOpen} 
        onOpenChange={setOracleCardsOpen}
        aiProfile={activeProfile}
      />
      
      {/* Moon Phase Tracker Dialog */}
      <MoonPhaseTracker
        open={moonTrackerOpen}
        onOpenChange={setMoonTrackerOpen}
        aiProfile={activeProfile}
      />
      
      {/* Affirmation Journal Dialog */}
      <AffirmationJournal
        open={affirmationJournalOpen}
        onOpenChange={setAffirmationJournalOpen}
        aiProfile={activeProfile}
      />
    </ScrollArea>
  );
};

export default SpiritualHub;

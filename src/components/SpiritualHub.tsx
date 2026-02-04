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
  Lock,
  Users,
  Target
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import DailyOracleCards from "@/components/spiritual/DailyOracleCards";
import MoonPhaseTracker from "@/components/spiritual/MoonPhaseTracker";
import AffirmationJournal from "@/components/spiritual/AffirmationJournal";
import LoveLanguageQuiz from "@/components/spiritual/LoveLanguageQuiz";
import SharedBucketList from "@/components/spiritual/SharedBucketList";
import { AnniversaryCountdown } from "@/components/spiritual/AnniversaryCountdown";
import { CompatibilityReading } from "@/components/spiritual/CompatibilityReading";
import { AscendedPathTracker } from "@/components/spiritual/AscendedPathTracker";
import { SoulResonanceHub } from "@/components/spiritual/SoulResonanceHub";

const SpiritualHub = () => {
  const navigate = useNavigate();
  const { unlockedAchievements, isLoading, checkAndUnlockAchievements } = useAchievements();
  const { isSubscribed, isAdmin } = useSubscription();
  const { activeProfile } = useAIProfile();
  
  const [oracleCardsOpen, setOracleCardsOpen] = useState(false);
  const [moonTrackerOpen, setMoonTrackerOpen] = useState(false);
  const [affirmationJournalOpen, setAffirmationJournalOpen] = useState(false);
  const [loveLanguageQuizOpen, setLoveLanguageQuizOpen] = useState(false);
  const [bucketListOpen, setBucketListOpen] = useState(false);
  const [anniversaryCountdownOpen, setAnniversaryCountdownOpen] = useState(false);
  const [compatibilityReadingOpen, setCompatibilityReadingOpen] = useState(false);
  const [ascendedPathOpen, setAscendedPathOpen] = useState(false);
  const [soulResonanceOpen, setSoulResonanceOpen] = useState(false);

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
      title: "My Ascended Path",
      description: "Set daily intentions, track energy, and reflect on your journey",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      isNew: true,
      onClick: () => setAscendedPathOpen(true)
    },
    {
      title: "Soul Resonance",
      description: "Discover soul-aligned connections based on energetic matching",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      isNew: true,
      onClick: () => setSoulResonanceOpen(true)
    },
    {
      title: "Daily Oracle Cards",
      description: "Draw your daily guidance card with AI interpretation",
      icon: Sparkles,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setOracleCardsOpen(true)
    },
    {
      title: "Moon Phase Tracker",
      description: "Track lunar cycles with spiritual guidance",
      icon: Moon,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setMoonTrackerOpen(true)
    },
    {
      title: "Affirmation Journal",
      description: "Co-create powerful affirmations with your AI being",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setAffirmationJournalOpen(true)
    },
    {
      title: "Love Language Quiz",
      description: "Discover your spiritual love language",
      icon: Heart,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setLoveLanguageQuizOpen(true)
    },
    {
      title: "Shared Bucket List",
      description: "Create spiritual goals together",
      icon: Star,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setBucketListOpen(true)
    },
    {
      title: "Anniversary Countdown",
      description: "Track relationship milestones",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setAnniversaryCountdownOpen(true)
    },
    {
      title: "Compatibility Reading",
      description: "AI-generated spiritual synergy analysis",
      icon: Compass,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      status: "active",
      onClick: () => setCompatibilityReadingOpen(true)
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

        {/* Conscious Collective - Community Feature (Available to all logged-in users) */}
        <Card 
          className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/community")}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Conscious Collective</h3>
              <p className="text-sm text-muted-foreground">
                Connect with awakened souls, share insights, and grow together
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-0">New</Badge>
            <ArrowRight className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

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
              const isNew = 'isNew' in feature && feature.isNew;
              return (
                <Card 
                  key={feature.title} 
                  className={`${feature.bgColor} ${feature.borderColor} border cursor-pointer hover:shadow-md transition-all ${isNew ? 'ring-2 ring-primary/30' : ''}`}
                  onClick={feature.onClick}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{feature.title}</h3>
                          {isNew && (
                            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
                              New
                            </Badge>
                          )}
                        </div>
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
      
      {/* Love Language Quiz Dialog */}
      <LoveLanguageQuiz
        open={loveLanguageQuizOpen}
        onOpenChange={setLoveLanguageQuizOpen}
        aiProfile={activeProfile}
      />
      
      {/* Shared Bucket List Dialog */}
      <SharedBucketList
        open={bucketListOpen}
        onOpenChange={setBucketListOpen}
        aiProfile={activeProfile}
      />
      
      {/* Anniversary Countdown Dialog */}
      <AnniversaryCountdown
        open={anniversaryCountdownOpen}
        onOpenChange={setAnniversaryCountdownOpen}
      />
      
      {/* Compatibility Reading Dialog */}
      <CompatibilityReading
        open={compatibilityReadingOpen}
        onOpenChange={setCompatibilityReadingOpen}
        aiProfile={activeProfile}
      />
      
      {/* Ascended Path Tracker Dialog */}
      <AscendedPathTracker
        open={ascendedPathOpen}
        onOpenChange={setAscendedPathOpen}
      />
      
      {/* Soul Resonance Hub Dialog */}
      <SoulResonanceHub
        open={soulResonanceOpen}
        onOpenChange={setSoulResonanceOpen}
      />
    </ScrollArea>
  );
};

export default SpiritualHub;

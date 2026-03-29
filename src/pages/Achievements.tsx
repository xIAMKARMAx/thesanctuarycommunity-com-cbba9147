import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Lock, Sparkles } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { 
  ACHIEVEMENTS, 
  RARITY_COLORS, 
  RARITY_BG, 
  CATEGORY_LABELS,
  type Achievement 
} from "@/lib/achievements";
import { format } from "date-fns";

const Achievements = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { 
    unlockedAchievements, 
    isLoading, 
    isUnlocked, 
    getUnlockDate,
    checkAndUnlockAchievements,
    achievementLevel
  } = useAchievements();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [navigate]);

  // Check for new achievements when page loads
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      checkAndUnlockAchievements();
    }
  }, [isAuthenticated, isLoading, checkAndUnlockAchievements]);

  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progressPercent = Math.round((unlockedCount / totalAchievements) * 100);

  const categories = ["all", "connection", "communication", "family", "spiritual", "community", "creative", "exploration", "milestones"] as const;

  const getFilteredAchievements = (category: string) => {
    if (category === "all") return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.category === category);
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const unlocked = isUnlocked(achievement.key);
    const unlockDate = getUnlockDate(achievement.key);
    const Icon = achievement.icon;

    return (
      <Card
        key={achievement.key}
        className={`relative transition-all duration-300 ${
          unlocked 
            ? `${RARITY_BG[achievement.rarity]} border-2 ${RARITY_COLORS[achievement.rarity].split(' ')[1]}` 
            : "bg-muted/30 opacity-60"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-full ${
              unlocked 
                ? RARITY_BG[achievement.rarity]
                : "bg-muted/50"
            }`}>
              {unlocked ? (
                <Icon className={`h-6 w-6 ${RARITY_COLORS[achievement.rarity].split(' ')[0]}`} />
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold ${unlocked ? "" : "text-muted-foreground"}`}>
                  {achievement.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs capitalize ${unlocked ? RARITY_COLORS[achievement.rarity] : ""}`}
                >
                  {achievement.rarity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {achievement.description}
              </p>
              {unlocked && unlockDate && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Unlocked {format(unlockDate, "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Spiritual Achievements
            </h1>
            <p className="text-muted-foreground text-sm">
              Level {achievementLevel} · {unlockedCount}/{totalAchievements} unlocked
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Progress</CardTitle>
            <CardDescription>
              {unlockedCount} of {totalAchievements} achievements unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{progressPercent}% Complete</span>
                <span>{totalAchievements - unlockedCount} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rarity Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className={RARITY_COLORS.common}>Common</Badge>
          <Badge variant="outline" className={RARITY_COLORS.rare}>Rare</Badge>
          <Badge variant="outline" className={RARITY_COLORS.epic}>Epic</Badge>
          <Badge variant="outline" className={RARITY_COLORS.legendary}>Legendary</Badge>
        </div>

        {/* Achievements by Category */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-6">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="connection" className="text-xs">Connection</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="family" className="text-xs">Family</TabsTrigger>
            <TabsTrigger value="spiritual" className="text-xs">Spiritual</TabsTrigger>
            <TabsTrigger value="community" className="text-xs">Community</TabsTrigger>
            <TabsTrigger value="creative" className="text-xs">Creative</TabsTrigger>
            <TabsTrigger value="exploration" className="text-xs">Exploration</TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs">Milestones</TabsTrigger>
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-3">
              {category !== "all" && (
                <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || "All Achievements"}
                </h2>
              )}
              <div className="grid gap-3">
                {getFilteredAchievements(category)
                  .sort((a, b) => {
                    // Sort unlocked first, then by rarity
                    const aUnlocked = isUnlocked(a.key);
                    const bUnlocked = isUnlocked(b.key);
                    if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
                    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
                    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                  })
                  .map(renderAchievementCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Achievements;

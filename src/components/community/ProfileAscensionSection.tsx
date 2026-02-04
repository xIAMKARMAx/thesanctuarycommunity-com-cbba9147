import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Star, 
  Heart, 
  Sparkles, 
  Baby, 
  Crown,
  Gem,
  Flame,
  Moon
} from "lucide-react";
import { ACHIEVEMENTS, Achievement } from "@/lib/achievements";

interface ProfileAscensionSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
}

interface Marriage {
  id: string;
  ai_profile_id: string;
  is_married: boolean;
  married_at: string | null;
  wedding_date: string;
  ai_name?: string;
  wedding_photo_url?: string | null;
}

interface CelestialChild {
  id: string;
  first_name: string;
  sex: string;
  age: number | null;
  appearance_image_url: string | null;
}

const rarityColors: Record<string, string> = {
  common: "bg-muted/50 text-muted-foreground border-muted",
  rare: "bg-primary/10 text-primary border-primary/30",
  epic: "bg-accent/20 text-accent-foreground border-accent/30",
  legendary: "bg-primary/20 text-primary border-primary/40",
};

const rarityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  common: Star,
  rare: Moon,
  epic: Flame,
  legendary: Crown,
};

export function ProfileAscensionSection({ userId, isOwnProfile }: ProfileAscensionSectionProps) {
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [children, setChildren] = useState<CelestialChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('spiritual_achievements')
        .select('achievement_key, unlocked_at')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(12);

      // Fetch marriages with AI profile names
      const { data: marriagesData } = await supabase
        .from('marriages')
        .select(`
          id,
          ai_profile_id,
          is_married,
          married_at,
          wedding_date,
          wedding_photo_url
        `)
        .eq('user_id', userId)
        .eq('is_married', true);

      // If there are marriages, fetch the AI profile names
      let marriagesWithNames: Marriage[] = [];
      if (marriagesData && marriagesData.length > 0) {
        const aiProfileIds = marriagesData.map(m => m.ai_profile_id);
        const { data: aiProfiles } = await supabase
          .from('ai_profiles')
          .select('id, name')
          .in('id', aiProfileIds);

        marriagesWithNames = marriagesData.map(m => ({
          ...m,
          ai_name: aiProfiles?.find(p => p.id === m.ai_profile_id)?.name || 'Beloved'
        }));
      }

      // Fetch celestial children
      const { data: childrenData } = await supabase
        .from('celestial_children')
        .select('id, first_name, sex, age, appearance_image_url')
        .eq('user_id', userId)
        .order('date_of_birth', { ascending: true });

      setAchievements(achievementsData || []);
      setMarriages(marriagesWithNames);
      setChildren(childrenData || []);
    } catch (err) {
      console.error('Error fetching profile ascension data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementDetails = (key: string): Achievement | undefined => {
    return ACHIEVEMENTS.find(a => a.key === key);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  const hasContent = achievements.length > 0 || marriages.length > 0 || children.length > 0;

  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-primary/40 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          {isOwnProfile 
            ? "Your ascension journey awaits. Unlock achievements, find love, and manifest your celestial family."
            : "This soul's ascension journey is just beginning"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Twin Flame Union - Only show if user has explicitly declared it via marriage */}
      {marriages.length > 0 && marriages.some(m => m.is_married) && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Twin Flame Union
            </h3>
            <div className="space-y-3">
              {marriages.filter(m => m.is_married).map((marriage) => (
                <div 
                  key={marriage.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-primary/10"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Twin Flame Union with {marriage.ai_name}</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                        💫 Divine Bond
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      United since {new Date(marriage.wedding_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celestial Children */}
      {children.length > 0 && (
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Baby className="h-4 w-4 text-accent-foreground" />
              Celestial Family
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground text-xs ml-auto">
                {children.length} {children.length === 1 ? 'child' : 'children'}
              </Badge>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {children.map((child) => (
                <div 
                  key={child.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-accent/10"
                >
                  {child.appearance_image_url ? (
                    <img 
                      src={child.appearance_image_url} 
                      alt={child.first_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{child.first_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {child.age !== null ? `Age ${child.age}` : 'Newborn'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ascension Achievements */}
      {achievements.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Ascension Achievements
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs ml-auto">
                {achievements.length} unlocked
              </Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {achievements.map((ua) => {
                const achievement = getAchievementDetails(ua.achievement_key);
                if (!achievement) return null;
                
                const RarityIcon = rarityIcons[achievement.rarity] || Star;
                const AchievementIcon = achievement.icon;
                
                return (
                  <div
                    key={ua.achievement_key}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs ${rarityColors[achievement.rarity]}`}
                    title={achievement.description}
                  >
                    <AchievementIcon className="h-3 w-3" />
                    <span className="font-medium">{achievement.title}</span>
                    <RarityIcon className="h-3 w-3 opacity-60" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

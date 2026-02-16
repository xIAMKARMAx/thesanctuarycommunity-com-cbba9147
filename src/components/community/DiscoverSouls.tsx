import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Sparkles, UserPlus, UserMinus, Users, Heart, Zap,
  Lock, Crown, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { SoulProfile, useSoulProfile } from "@/hooks/useSoulProfile";
import { useFollows } from "@/hooks/useFollows";
import { getSoulResonanceSuggestions, ResonanceScore } from "@/lib/soul-resonance";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getSoulSuggestionLimit, getTierFromProductId } from "@/lib/subscription-tiers";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useResonanceEvents } from "@/hooks/useResonanceEvents";

interface DiscoverSoulsProps {
  currentUserId?: string;
}

export function DiscoverSouls({ currentUserId }: DiscoverSoulsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allSouls, setAllSouls] = useState<SoulProfile[]>([]);
  const [resonantSouls, setResonantSouls] = useState<ResonanceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { profile: currentProfile } = useSoulProfile(currentUserId);
  const { isFollowing, followUser, unfollowUser } = useFollows(currentUserId);
  const { productId } = useSubscription();
  const { isAdmin } = useAdminRole();
  const { logEvent, getDynamicScores } = useResonanceEvents(currentUserId);
  
  const suggestionLimit = getSoulSuggestionLimit(productId, isAdmin);
  const currentTier = getTierFromProductId(productId);

  useEffect(() => {
    fetchSouls();
  }, [currentUserId, currentProfile, suggestionLimit]);

  const fetchSouls = async () => {
    try {
      const { data, error } = await supabase
        .from('soul_profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', currentUserId || '')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const profiles = data || [];
      setAllSouls(profiles);
      
      if (currentProfile && profiles.length > 0) {
        // Fetch dynamic scores to blend with static
        const dynamicScores = await getDynamicScores();
        const suggestions = getSoulResonanceSuggestions(
          currentProfile,
          profiles,
          suggestionLimit,
          dynamicScores as any[]
        );
        setResonantSouls(suggestions);
      } else {
        const limitedProfiles = profiles.slice(0, Math.min(suggestionLimit, 5));
        setResonantSouls(limitedProfiles.map(p => ({
          profile: p,
          score: 0,
          staticScore: 0,
          dynamicScore: 0,
          trend: 'stable' as const,
          matchReasons: []
        })));
      }
    } catch (err) {
      console.error('Error fetching souls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchSouls();
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('soul_profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', currentUserId || '')
        .or(`display_name.ilike.%${searchQuery}%,soul_title.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,spiritual_journey.ilike.%${searchQuery}%`)
        .limit(20);
      if (error) throw error;
      setAllSouls(data || []);
    } catch (err) {
      console.error('Error searching souls:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
      // Log resonance event for follow
      logEvent(userId, 'follow');
    }
  };

  const handleProfileClick = (userId: string) => {
    // Log profile view as resonance event
    logEvent(userId, 'profile_view');
    navigate(`/soul/${userId}`);
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'rising') return <TrendingUp className="h-3 w-3 text-primary" />;
    if (trend === 'fading') return <TrendingDown className="h-3 w-3 text-muted-foreground" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const ResonantSoulCard = ({ result }: { result: ResonanceScore }) => (
    <Card 
      className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all cursor-pointer group"
      onClick={() => handleProfileClick(result.profile.user_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-primary/40 shrink-0">
                <AvatarImage src={result.profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  <Sparkles className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {result.score > 30 && (
                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                  <Zap className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">{result.profile.display_name}</p>
                {result.dynamicScore > 0 && (
                  <TrendIcon trend={result.trend} />
                )}
              </div>
              {result.profile.soul_title && (
                <p className="text-xs text-primary truncate">{result.profile.soul_title}</p>
              )}
            </div>
          </div>
          
          {currentUserId && currentUserId !== result.profile.user_id && (
            <Button
              variant={isFollowing(result.profile.user_id) ? "outline" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle(result.profile.user_id);
              }}
              className="shrink-0"
            >
              {isFollowing(result.profile.user_id) ? (
                <UserMinus className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {result.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {result.matchReasons.map((reason, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs bg-primary/20 text-primary border-primary/30"
              >
                <Heart className="h-2.5 w-2.5 mr-1" />
                {reason}
              </Badge>
            ))}
          </div>
        )}

        {(result.profile.gifts_and_talents?.length || result.profile.seeking?.length) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {result.profile.gifts_and_talents?.slice(0, 2).map((gift, i) => (
              <Badge key={`gift-${i}`} variant="outline" className="text-xs border-primary/20">
                ✨ {gift}
              </Badge>
            ))}
            {result.profile.seeking?.slice(0, 1).map((seek, i) => (
              <Badge key={`seek-${i}`} variant="outline" className="text-xs border-muted-foreground/20">
                🔮 {seek}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const SoulCard = ({ soul }: { soul: SoulProfile }) => (
    <Card 
      className="border-primary/20 bg-card/50 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => handleProfileClick(soul.user_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 border border-primary/20 shrink-0">
              <AvatarImage src={soul.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">{soul.display_name}</p>
                {!soul.is_public && (
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
              {soul.soul_title && (
                <p className="text-xs text-primary truncate">{soul.soul_title}</p>
              )}
              {soul.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{soul.bio}</p>
              )}
            </div>
          </div>
          {currentUserId && currentUserId !== soul.user_id && (
            <Button
              variant={isFollowing(soul.user_id) ? "outline" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle(soul.user_id);
              }}
              className="shrink-0"
            >
              {isFollowing(soul.user_id) ? (
                <UserMinus className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {(soul.gifts_and_talents?.length || soul.seeking?.length) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {soul.gifts_and_talents?.slice(0, 2).map((gift, i) => (
              <Badge key={`gift-${i}`} variant="secondary" className="text-xs bg-primary/10 text-primary">
                ✨ {gift}
              </Badge>
            ))}
            {soul.seeking?.slice(0, 2).map((seek, i) => (
              <Badge key={`seek-${i}`} variant="outline" className="text-xs">
                🔮 {seek}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search souls by name, title, journey, or gifts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10"
        />
      </div>

      {!searchQuery && resonantSouls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Soul Resonance Connections</h3>
                <p className="text-xs text-muted-foreground">
                  Dynamic alignment based on energy & interaction
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Crown className="h-3 w-3" />
              {suggestionLimit}/day
            </Badge>
          </div>
          
          <div className="space-y-3">
            {resonantSouls.map(result => (
              <ResonantSoulCard key={result.profile.id} result={result} />
            ))}
          </div>
          
          {currentTier !== 'architect' && !isAdmin && (
            <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Unlock More Soul Connections</p>
                    <p className="text-xs text-muted-foreground">
                      {currentTier === 'awakening' 
                        ? 'Upgrade to Anchoring for 7 daily suggestions'
                        : currentTier === 'anchoring'
                        ? 'Upgrade to Architect for 15+ daily suggestions'
                        : 'Subscribe to receive personalized soul suggestions'
                      }
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/pricing')} className="shrink-0">
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {resonantSouls.length === 0 && currentProfile && (
            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardContent className="p-4 text-center">
                <Sparkles className="h-8 w-8 text-primary/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Complete your profile with gifts and seeking to find resonant souls
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {searchQuery ? 'Search Results' : 'All Souls in the Collective'}
        </h3>
        
        {searchLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : allSouls.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? "No souls found matching your search"
                : "No other souls have joined the collective yet"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allSouls.map(soul => (
              <SoulCard key={soul.id} soul={soul} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

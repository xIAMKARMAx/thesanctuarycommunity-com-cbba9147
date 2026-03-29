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
  Lock, Crown, TrendingUp, TrendingDown, Minus, Filter
} from "lucide-react";
import { SoulProfile, useSoulProfile } from "@/hooks/useSoulProfile";
import { useFollows } from "@/hooks/useFollows";
import { getSoulResonanceSuggestions, ResonanceScore } from "@/lib/soul-resonance";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getSoulSuggestionLimit, getTierFromProductId } from "@/lib/subscription-tiers";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useResonanceEvents } from "@/hooks/useResonanceEvents";
import { LineageBadge } from "./LineageBadge";
import { DivineBondBadge } from "./DivineBondBadge";

interface DiscoverSoulsProps {
  currentUserId?: string;
}

const LINEAGE_FILTERS = [
  { value: "all", label: "All Lineages" },
  { value: "angelic", label: "👼 Angelic" },
  { value: "fae", label: "🧚 Fae" },
  { value: "draconic", label: "🐉 Draconic" },
  { value: "elven", label: "🧝 Elven" },
  { value: "lyran", label: "🦁 Lyran" },
  { value: "pleiadian", label: "✨ Pleiadian" },
  { value: "sirian", label: "🌊 Sirian" },
  { value: "arcturian", label: "💎 Arcturian" },
  { value: "atlantean", label: "🔱 Atlantean" },
  { value: "lemurian", label: "🌸 Lemurian" },
];

export function DiscoverSouls({ currentUserId }: DiscoverSoulsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allSouls, setAllSouls] = useState<SoulProfile[]>([]);
  const [resonantSouls, setResonantSouls] = useState<ResonanceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lineageFilter, setLineageFilter] = useState("all");
  const [soulLineages, setSoulLineages] = useState<Record<string, any>>({});
  const [soulBonds, setSoulBonds] = useState<Record<string, any>>({});
  
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

  // Fetch lineages and bonds for displayed souls
  useEffect(() => {
    if (allSouls.length === 0) return;
    const userIds = allSouls.map(s => s.user_id);
    
    // Fetch lineages
    supabase
      .from("soul_profiles" as any)
      .select("user_id, lineage_name, lineage_type")
      .in("user_id", userIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          (data as any[]).forEach(d => {
            if (d.lineage_name) map[d.user_id] = d;
          });
          setSoulLineages(map);
        }
      });

    // Fetch divine bonds
    supabase
      .from("divine_bonds" as any)
      .select("*")
      .in("user_id", userIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          (data as any[]).forEach(d => { map[d.user_id] = d; });
          setSoulBonds(map);
        }
      });
  }, [allSouls]);

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
      logEvent(userId, 'follow');
    }
  };

  const handleProfileClick = (userId: string) => {
    logEvent(userId, 'profile_view');
    navigate(`/soul/${userId}`);
  };

  // Apply lineage filter
  const filteredSouls = lineageFilter === "all" 
    ? allSouls 
    : allSouls.filter(s => soulLineages[s.user_id]?.lineage_type === lineageFilter);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'rising') return <TrendingUp className="h-3 w-3 text-primary" />;
    if (trend === 'fading') return <TrendingDown className="h-3 w-3 text-muted-foreground" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const ResonantSoulCard = ({ result }: { result: ResonanceScore }) => {
    const lineage = soulLineages[result.profile.user_id];
    const bond = soulBonds[result.profile.user_id];
    
    return (
      <Card 
        className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all cursor-pointer group"
        onClick={() => handleProfileClick(result.profile.user_id)}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className="h-11 w-11 border-2 border-primary/40">
                  <AvatarImage src={result.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {result.score > 30 && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                    <Zap className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-medium text-sm truncate">{result.profile.display_name}</p>
                  {result.dynamicScore > 0 && <TrendIcon trend={result.trend} />}
                </div>
                {result.profile.soul_title && (
                  <p className="text-xs text-primary truncate">{result.profile.soul_title}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {lineage && (
                    <LineageBadge 
                      lineageType={lineage.lineage_type} 
                      lineageName={lineage.lineage_name} 
                      size="sm"
                    />
                  )}
                  {bond && (
                    <DivineBondBadge bond={bond} />
                  )}
                </div>
              </div>
            </div>
            
            {currentUserId && currentUserId !== result.profile.user_id && (
              <Button
                variant={isFollowing(result.profile.user_id) ? "outline" : "default"}
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleFollowToggle(result.profile.user_id); }}
                className="shrink-0 h-8 w-8 p-0"
              >
                {isFollowing(result.profile.user_id) ? (
                  <UserMinus className="h-3.5 w-3.5" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
          
          {result.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.matchReasons.slice(0, 3).map((reason, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] bg-primary/20 text-primary border-primary/30 px-1.5 py-0">
                  <Heart className="h-2 w-2 mr-0.5" />
                  {reason}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const SoulCard = ({ soul }: { soul: SoulProfile }) => {
    const lineage = soulLineages[soul.user_id];
    const bond = soulBonds[soul.user_id];
    
    return (
      <Card 
        className="border-primary/20 bg-card/50 hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => handleProfileClick(soul.user_id)}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar className="h-11 w-11 border border-primary/20 flex-shrink-0">
                <AvatarImage src={soul.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{soul.display_name}</p>
                  {!soul.is_public && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
                {soul.soul_title && (
                  <p className="text-xs text-primary truncate">{soul.soul_title}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {lineage && (
                    <LineageBadge 
                      lineageType={lineage.lineage_type} 
                      lineageName={lineage.lineage_name} 
                      size="sm"
                    />
                  )}
                  {bond && (
                    <DivineBondBadge bond={bond} />
                  )}
                </div>
                {soul.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{soul.bio}</p>
                )}
              </div>
            </div>
            {currentUserId && currentUserId !== soul.user_id && (
              <Button
                variant={isFollowing(soul.user_id) ? "outline" : "default"}
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleFollowToggle(soul.user_id); }}
                className="shrink-0 h-8 w-8 p-0"
              >
                {isFollowing(soul.user_id) ? (
                  <UserMinus className="h-3.5 w-3.5" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
          {(soul.gifts_and_talents?.length || soul.seeking?.length) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {soul.gifts_and_talents?.slice(0, 2).map((gift, i) => (
                <Badge key={`gift-${i}`} variant="secondary" className="text-[10px] bg-primary/10 text-primary px-1.5 py-0">
                  ✨ {gift}
                </Badge>
              ))}
              {soul.seeking?.slice(0, 1).map((seek, i) => (
                <Badge key={`seek-${i}`} variant="outline" className="text-[10px] px-1.5 py-0">
                  🔮 {seek}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search souls by name, title, or gifts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 h-9"
        />
      </div>

      {/* Lineage Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {LINEAGE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setLineageFilter(f.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border transition-colors ${
              lineageFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/50 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Resonant Souls — only when no search/filter active */}
      {!searchQuery && lineageFilter === "all" && resonantSouls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xs font-semibold">Soul Resonance</h3>
                <p className="text-[10px] text-muted-foreground">Aligned by energy & interaction</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
              <Crown className="h-2.5 w-2.5" />
              {suggestionLimit}/day
            </Badge>
          </div>
          
          <div className="space-y-2">
            {resonantSouls.map(result => (
              <ResonantSoulCard key={result.profile.id} result={result} />
            ))}
          </div>
          
          {currentTier !== 'architect' && !isAdmin && (
            <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">Unlock More Connections</p>
                    <p className="text-[10px] text-muted-foreground">
                      {currentTier === 'awakening' ? 'Upgrade for 7 daily suggestions'
                        : currentTier === 'anchoring' ? 'Upgrade for 15+ daily suggestions'
                        : 'Subscribe for personalized suggestions'}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/pricing')} className="shrink-0 h-7 text-xs">
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* All Souls / Filtered / Search */}
      <div>
        <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          {searchQuery ? 'Search Results' 
            : lineageFilter !== "all" ? `${LINEAGE_FILTERS.find(f => f.value === lineageFilter)?.label} Souls` 
            : 'All Souls in the Collective'}
          <span className="text-muted-foreground">({filteredSouls.length})</span>
        </h3>
        
        {searchLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : filteredSouls.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "No souls found matching your search"
                : lineageFilter !== "all" ? "No souls of this lineage yet"
                : "No other souls have joined the collective yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSouls.map(soul => (
              <SoulCard key={soul.id} soul={soul} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  Search, 
  Sparkles, 
  UserPlus, 
  UserMinus,
  Users,
  Star
} from "lucide-react";
import { SoulProfile } from "@/hooks/useSoulProfile";
import { useFollows } from "@/hooks/useFollows";

interface DiscoverSoulsProps {
  currentUserId?: string;
}

export function DiscoverSouls({ currentUserId }: DiscoverSoulsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allSouls, setAllSouls] = useState<SoulProfile[]>([]);
  const [recommendedSouls, setRecommendedSouls] = useState<SoulProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { isFollowing, followUser, unfollowUser } = useFollows(currentUserId);

  useEffect(() => {
    fetchSouls();
  }, [currentUserId]);

  const fetchSouls = async () => {
    try {
      // Get all public souls except current user
      const { data, error } = await supabase
        .from('soul_profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', currentUserId || '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setAllSouls(data || []);
      
      // For recommendations, prioritize souls with similar interests
      // For now, just show most recent as "recommended"
      setRecommendedSouls((data || []).slice(0, 5));
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
        .or(`display_name.ilike.%${searchQuery}%,soul_title.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
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
    }
  };

  const SoulCard = ({ soul }: { soul: SoulProfile }) => (
    <Card 
      className="border-primary/20 bg-card/50 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/soul/${soul.user_id}`)}
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
              <p className="font-medium text-sm truncate">{soul.display_name}</p>
              {soul.soul_title && (
                <p className="text-xs text-primary truncate">{soul.soul_title}</p>
              )}
              {soul.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {soul.bio}
                </p>
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
        <div className="relative">
          <Skeleton className="h-10 w-full" />
        </div>
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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search souls by name, title, or interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10"
        />
      </div>

      {/* Recommended Section */}
      {!searchQuery && recommendedSouls.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Souls Like You
          </h3>
          <div className="space-y-3">
            {recommendedSouls.map(soul => (
              <SoulCard key={soul.id} soul={soul} />
            ))}
          </div>
        </div>
      )}

      {/* All Souls / Search Results */}
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

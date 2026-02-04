import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, UserMinus, Users } from "lucide-react";
import { useFollows } from "@/hooks/useFollows";
import { SoulProfile } from "@/hooks/useSoulProfile";

interface ConnectionsListProps {
  userId: string;
  currentUserId?: string;
}

export function ConnectionsList({ userId, currentUserId }: ConnectionsListProps) {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<SoulProfile[]>([]);
  const [following, setFollowing] = useState<SoulProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("following");
  
  const { isFollowing, unfollowUser } = useFollows(currentUserId);

  useEffect(() => {
    fetchConnections();
  }, [userId]);

  const fetchConnections = async () => {
    try {
      // Fetch followers (people who follow this user)
      const { data: followersData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      const followerIds = (followersData || []).map(f => f.follower_id);
      
      if (followerIds.length > 0) {
        const { data: followerProfiles } = await supabase
          .from('soul_profiles')
          .select('*')
          .in('user_id', followerIds);
        setFollowers(followerProfiles || []);
      }

      // Fetch following (people this user follows)
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = (followingData || []).map(f => f.following_id);
      
      if (followingIds.length > 0) {
        const { data: followingProfiles } = await supabase
          .from('soul_profiles')
          .select('*')
          .in('user_id', followingIds);
        setFollowing(followingProfiles || []);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    await unfollowUser(targetUserId);
    setFollowing(prev => prev.filter(p => p.user_id !== targetUserId));
  };

  const ConnectionCard = ({ profile, showUnfollow = false }: { profile: SoulProfile; showUnfollow?: boolean }) => (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border border-primary/10 bg-card/50 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/soul/${profile.user_id}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-primary/20">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{profile.display_name}</p>
          {profile.soul_title && (
            <p className="text-xs text-primary">{profile.soul_title}</p>
          )}
        </div>
      </div>
      
      {showUnfollow && currentUserId === userId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleUnfollow(profile.user_id);
          }}
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="following" className="gap-2">
          Following ({following.length})
        </TabsTrigger>
        <TabsTrigger value="followers" className="gap-2">
          Followers ({followers.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="following" className="space-y-3">
        {following.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Not following anyone yet
            </p>
          </div>
        ) : (
          following.map(profile => (
            <ConnectionCard 
              key={profile.id} 
              profile={profile} 
              showUnfollow={true}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="followers" className="space-y-3">
        {followers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No followers yet
            </p>
          </div>
        ) : (
          followers.map(profile => (
            <ConnectionCard 
              key={profile.id} 
              profile={profile}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Sparkles, 
  MapPin, 
  Link as LinkIcon,
  Users,
  MessageCircle,
  Edit3,
  UserPlus,
  UserMinus
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { SoulProfile, useSoulProfile } from "@/hooks/useSoulProfile";
import { useFollows } from "@/hooks/useFollows";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { CommunityPost, useCommunityFeed } from "@/hooks/useCommunityFeed";
import { EditSoulProfileDialog } from "@/components/community/EditSoulProfileDialog";
import { ConnectionsList } from "@/components/community/ConnectionsList";

const SoulProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [authLoading, setAuthLoading] = useState(true);
  
  const { isFollowing, followUser, unfollowUser } = useFollows(currentUserId);
  const { blessPost, deletePost } = useCommunityFeed();
  const { profile, loading: profileLoading, updateProfile, createProfile, refetch } = useSoulProfile(userId);

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        navigate("/auth");
      } else {
        setCurrentUserId(data.session.user?.id);
      }
      setAuthLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId || authLoading) return;
    fetchUserPosts();
    fetchFollowCounts();
  }, [userId, authLoading]);

  const fetchUserPosts = async () => {
    if (!userId) return;
    
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      const { data: profileData } = await supabase
        .from('soul_profiles')
        .select('display_name, soul_title, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      let userBlessings: { post_id: string; blessing_type: string }[] = [];
      if (currentUserId) {
        const { data: blessingsData } = await supabase
          .from('post_blessings')
          .select('post_id, blessing_type')
          .eq('user_id', currentUserId);
        userBlessings = blessingsData || [];
      }

      const postsWithAuthors = (postsData || []).map(post => ({
        ...post,
        author: profileData as { display_name: string; soul_title: string | null; avatar_url: string | null } | null,
        user_blessing: userBlessings.find(b => b.post_id === post.id)?.blessing_type || null,
      }));

      setUserPosts(postsWithAuthors);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    if (!userId) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
      ]);

      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
    } catch (err) {
      console.error('Error fetching follow counts:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId) return;
    
    if (isFollowing(userId)) {
      await unfollowUser(userId);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else {
      await followUser(userId);
      setFollowerCount(prev => prev + 1);
    }
  };

  const handleSaveProfile = async (updates: Partial<SoulProfile>) => {
    if (profile) {
      await updateProfile(updates);
    } else if (userId) {
      await createProfile(updates);
    }
    refetch();
  };

  if (profileLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="h-32 w-full rounded-lg mb-4" />
          <Skeleton className="h-20 w-20 rounded-full mx-auto -mt-12 mb-4" />
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Show setup prompt for own profile without a soul profile
  if (!profile && isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">Create Your Soul Profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Set up your presence in the Conscious Collective
          </p>
          <Button onClick={() => setEditDialogOpen(true)}>
            Create Profile
          </Button>
        </div>
        
        <EditSoulProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={null}
          onSave={handleSaveProfile}
          userId={userId}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">Soul Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This soul has not yet joined the collective
          </p>
          <Button onClick={() => navigate('/chat?tab=community')}>
            Return to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${profile.display_name} | Conscious Collective`}
        description={profile.bio || `View ${profile.display_name}'s soul profile`}
        canonicalUrl={`https://prometheus.lovable.app/soul/${userId}`}
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Cover & Avatar */}
        <div className="relative">
          <div 
            className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background"
            style={profile.cover_image_url ? { 
              backgroundImage: `url(${profile.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          />
          
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex justify-between items-end -mt-12">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  <Sparkles className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              
              {!isOwnProfile && currentUserId && (
                <Button
                  variant={isFollowing(userId!) ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowToggle}
                  className="gap-2"
                >
                  {isFollowing(userId!) ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold">{profile.display_name}</h1>
            {profile.soul_title && (
              <p className="text-sm text-primary">{profile.soul_title}</p>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.website_url && (
              <a 
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>

          {/* Stats - Clickable to Connections */}
          <div className="flex gap-4 text-sm mb-4">
            <button 
              onClick={() => setActiveTab("connections")}
              className="hover:underline"
            >
              <strong>{followingCount}</strong>{" "}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button 
              onClick={() => setActiveTab("connections")}
              className="hover:underline"
            >
              <strong>{followerCount}</strong>{" "}
              <span className="text-muted-foreground">Followers</span>
            </button>
          </div>

          {/* Gifts & Seeking */}
          {(profile.gifts_and_talents?.length || profile.seeking?.length) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.gifts_and_talents?.map((gift, i) => (
                <Badge key={`gift-${i}`} variant="secondary" className="bg-primary/10 text-primary">
                  ✨ {gift}
                </Badge>
              ))}
              {profile.seeking?.map((seek, i) => (
                <Badge key={`seek-${i}`} variant="outline">
                  🔮 {seek}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-border/50">
          <div className="container max-w-2xl mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start h-12 bg-transparent border-0 p-0 gap-4">
                <TabsTrigger 
                  value="posts" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="connections" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Users className="h-4 w-4" />
                  Connections
                </TabsTrigger>
                <TabsTrigger 
                  value="journey" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Journey
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="py-4">
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile 
                        ? "Share your first insight with the collective"
                        : "This soul hasn't shared any posts yet"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map(post => (
                      <CommunityPostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        onBless={blessPost}
                        onDelete={deletePost}
                        onProfileClick={() => {}}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="connections" className="py-4">
                <ConnectionsList 
                  userId={userId!} 
                  currentUserId={currentUserId}
                />
              </TabsContent>

              <TabsContent value="journey" className="py-4">
                {profile.spiritual_journey ? (
                  <Card className="border-primary/20 bg-card/50">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Spiritual Journey
                      </h3>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {profile.spiritual_journey}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile 
                        ? "Share your spiritual journey"
                        : "This soul hasn't shared their journey yet"
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditSoulProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onSave={handleSaveProfile}
        userId={userId}
      />
    </>
  );
};

export default SoulProfilePage;

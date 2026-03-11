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
  UserMinus,
  Crown,
  Lock,
  Bot,
  Globe
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { SoulProfile, useSoulProfile } from "@/hooks/useSoulProfile";
import { useFollows } from "@/hooks/useFollows";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { CommunityPost, useCommunityFeed } from "@/hooks/useCommunityFeed";
import { EditSoulProfileDialog } from "@/components/community/EditSoulProfileDialog";
import { ConnectionsList } from "@/components/community/ConnectionsList";
import { HigherSelfSection } from "@/components/community/HigherSelfSection";
import { TransmissionsButton } from "@/components/transmissions/TransmissionsButton";
import { MyAICompanionsTab } from "@/components/community/MyAICompanionsTab";
import { AIDisplayPrompt } from "@/components/community/AIDisplayPrompt";
import { EchoesTab } from "@/components/community/EchoesTab";
import { Radio } from "lucide-react";
import { usePrometheanLegends } from "@/hooks/usePrometheanLegends";

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
  const [userVesselUrl, setUserVesselUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userWorlds, setUserWorlds] = useState<any[]>([]);
  
  const { isFollowing, followUser, unfollowUser } = useFollows(currentUserId);
  const { blessPost, deletePost } = useCommunityFeed();
  const { profile, loading: profileLoading, updateProfile, createProfile, refetch } = useSoulProfile(userId);
  const { isLegend } = usePrometheanLegends();

  const isOwnProfile = currentUserId === userId;
  const isPrivateToViewer = !isOwnProfile && profile && !profile.is_public && !isConnected;

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
    fetchUserVessel();
    checkConnection();
    fetchUserWorlds();
  }, [userId, authLoading, currentUserId]);

  const fetchUserWorlds = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_worlds")
      .select("id, name, description, is_public, visitor_count, is_default")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }) as any;
    setUserWorlds(data || []);
  };

  const checkConnection = async () => {
    if (!userId || !currentUserId || userId === currentUserId) {
      setIsConnected(userId === currentUserId);
      return;
    }
    try {
      const { count } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .or(`and(follower_id.eq.${currentUserId},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${currentUserId})`);
      setIsConnected((count || 0) > 0);
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const fetchUserVessel = async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      setUserVesselUrl(data?.user_avatar_url || null);
    } catch (err) {
      console.error('Error fetching user vessel:', err);
    }
  };

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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/community");
  };

  if (profileLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Button variant="ghost" size="sm" onClick={handleBack}>
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
              <Button variant="ghost" size="sm" onClick={handleBack}>
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
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <Avatar className="h-20 w-20 mx-auto mb-4 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              <Sparkles className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-medium mb-2">This soul hasn't set up their profile yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            They're part of the community but haven't created their Soul Profile
          </p>
          <Button onClick={() => navigate('/chat?tab=community')}>
            Return to Community
          </Button>
        </div>
      </div>
    );
  }

  // Private profile - show only display name to non-connections
  if (isPrivateToViewer) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </div>
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <Lock className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{profile.display_name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <p className="text-sm">This profile is private</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Follow this soul to see their full profile, posts, and spiritual journey
            </p>
            {currentUserId && (
              <Button
                variant={isFollowing(userId!) ? "outline" : "default"}
                onClick={handleFollowToggle}
                className="gap-2 mt-2"
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
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
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
                 <div className="flex items-center gap-2">
                   <TransmissionsButton 
                     userId={userId!}
                     displayName={profile?.display_name || 'User'}
                     variant="compact"
                   />
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
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{profile.display_name}</h1>
              {userId && isLegend(userId) && (
                <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30 text-[10px] gap-1">
                  <Crown className="h-3 w-3" />
                  Promethean Legend
                </Badge>
              )}
            </div>
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
              <TabsList className="w-full justify-start h-12 bg-transparent border-0 p-0 gap-4 overflow-x-auto flex-nowrap">
                <TabsTrigger 
                  value="posts" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="echoes" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Radio className="h-4 w-4" />
                  Echoes
                </TabsTrigger>
                <TabsTrigger 
                  value="connections" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Users className="h-4 w-4" />
                  Connections
                </TabsTrigger>
                <TabsTrigger 
                  value="higher-self" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Higher Self
                </TabsTrigger>
                <TabsTrigger 
                  value="my-ai" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Bot className="h-4 w-4" />
                  My AI
                </TabsTrigger>
                <TabsTrigger 
                  value="worlds" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Worlds
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

              <TabsContent value="echoes" className="py-4">
                <EchoesTab
                  profileUserId={userId!}
                  currentUserId={currentUserId}
                  isOwnProfile={isOwnProfile}
                  onProfileClick={(uid) => navigate(`/soul/${uid}`)}
                />
              </TabsContent>

              <TabsContent value="connections" className="py-4">
                <ConnectionsList 
                  userId={userId!} 
                  currentUserId={currentUserId}
                />
              </TabsContent>


              <TabsContent value="higher-self" className="py-4">
                <HigherSelfSection 
                  profile={profile}
                  userId={userId!} 
                  isOwnProfile={isOwnProfile}
                  onUpdate={updateProfile}
                  userVesselUrl={userVesselUrl}
                />
              </TabsContent>

              <TabsContent value="my-ai" className="py-4">
                <MyAICompanionsTab
                  userId={userId!}
                  isOwnProfile={isOwnProfile}
                />
              </TabsContent>
              <TabsContent value="worlds" className="py-4">
                {userWorlds.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile 
                        ? "You haven't created any worlds yet"
                        : "This soul hasn't created any worlds yet"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userWorlds.map((w: any) => (
                      <button
                        key={w.id}
                        onClick={() => w.is_public || w.is_default ? navigate(`/new-earth?visit=${w.id}`) : null}
                        className="w-full text-left rounded-lg border border-border/50 bg-card/50 p-4 hover:bg-card/80 transition-colors"
                        disabled={!w.is_public && !w.is_default && !isOwnProfile}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{w.name}</span>
                            {w.is_default && (
                              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Default</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {w.is_public || w.is_default ? (
                              <span className="text-primary">Public</span>
                            ) : (
                              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
                            )}
                            {w.visitor_count > 0 && (
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {w.visitor_count}</span>
                            )}
                          </div>
                        </div>
                        {w.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{w.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* AI Display Opt-in Prompt (shown once) */}
      {isOwnProfile && currentUserId && (
        <AIDisplayPrompt userId={currentUserId} />
      )}

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

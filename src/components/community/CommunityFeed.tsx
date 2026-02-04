import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSoulProfile } from "@/hooks/useSoulProfile";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";
import { CreatePostCard } from "./CreatePostCard";
import { CommunityPostCard } from "./CommunityPostCard";
import { SetupSoulProfileCard } from "./SetupSoulProfileCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Sparkles, RefreshCw } from "lucide-react";

export function CommunityFeed() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data?.session?.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading, createProfile, updateProfile } = useSoulProfile(currentUserId);
  const { posts, loading: feedLoading, hasMore, createPost, blessPost, deletePost, loadMore, refetch } = useCommunityFeed();

  const handleCreatePost = async (content: string, postType: string, imageUrl?: string, videoUrl?: string) => {
    setIsCreating(true);
    const result = await createPost(content, postType, imageUrl, videoUrl);
    setIsCreating(false);
    return result;
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/soul/${userId}`);
  };

  // Show profile setup if user doesn't have one
  const showProfileSetup = currentUserId && !profileLoading && !profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Collective Feed</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Profile Setup Card */}
      {showProfileSetup && (
        <SetupSoulProfileCard 
          onComplete={(data) => createProfile(data)} 
        />
      )}

      {/* Create Post */}
      {profile && (
        <CreatePostCard
          profile={profile}
          onSubmit={handleCreatePost}
          isSubmitting={isCreating}
        />
      )}

      {/* Feed */}
      {feedLoading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-primary/10 bg-card/50">
              <div className="flex gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground/80 mb-2">
            The Collective Awaits
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Be the first to share your light. Your insights could illuminate someone's path today.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onBless={blessPost}
                onDelete={deletePost}
                onProfileClick={handleProfileClick}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={feedLoading}
                className="gap-2"
              >
                {feedLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

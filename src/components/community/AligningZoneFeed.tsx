import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSoulProfile } from "@/hooks/useSoulProfile";
import { useAligningZoneFeed } from "@/hooks/useAligningZoneFeed";
import { CommunityPostCard } from "./CommunityPostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, RefreshCw, Compass } from "lucide-react";

export function AligningZoneFeed() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data?.session?.user?.id);
    });
  }, []);

  const { profile } = useSoulProfile(currentUserId);
  const { posts, loading, hasMore, blessPost, loadMore, refetch, shuffle } = useAligningZoneFeed();

  const handleProfileClick = (userId: string) => {
    navigate(`/soul/${userId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">The Aligning Zone</h2>
            <p className="text-xs text-muted-foreground">Discover souls across the collective</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shuffle}
            className="gap-2"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Discovery Info */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Your Portal to New Connections
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Explore posts from souls you haven't discovered yet. Every scroll could reveal your next meaningful connection.
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
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
          <Compass className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground/80 mb-2">
            The Zone Awaits New Energy
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No posts to discover yet. Be the first to share your light and inspire others!
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
                onProfileClick={handleProfileClick}
                showDiscoveryIndicator
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Discover More
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

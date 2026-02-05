import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { LoadingRecovery } from "@/components/LoadingRecovery";
import SEOHead from "@/components/SEOHead";

const CommunityPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const highlightCommentId = searchParams.get("comment");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);

      if (!postId) return;

      // Fetch the post
      const { data: postData, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error || !postData) {
        console.error("Post not found:", error);
        setLoading(false);
        return;
      }

      // Fetch author profile
      const { data: authorProfile } = await supabase
        .from("soul_profiles")
        .select("display_name, avatar_url, soul_title")
        .eq("user_id", postData.user_id)
        .single();

      // Check if current user blessed this post
      const { data: userBlessing } = await supabase
        .from("post_blessings")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      setPost({
        ...postData,
        author: authorProfile || { display_name: "Anonymous Soul", avatar_url: null },
        user_blessing: userBlessing,
      });
      setLoading(false);
    };

    init();
  }, [postId, navigate]);

  const handleBless = async (postId: string, type: string) => {
    if (!currentUserId) return;
    
    if (post.user_blessing) {
      await supabase.from("post_blessings").delete().eq("post_id", postId).eq("user_id", currentUserId);
      setPost((prev: any) => ({ ...prev, user_blessing: null, blessing_count: Math.max(0, prev.blessing_count - 1) }));
    } else {
      const { data } = await supabase.from("post_blessings").insert({ post_id: postId, user_id: currentUserId, blessing_type: type }).select().single();
      setPost((prev: any) => ({ ...prev, user_blessing: data, blessing_count: prev.blessing_count + 1 }));
    }
  };

  if (loading) {
    return <LoadingRecovery loadingStep="Loading post..." onRecovery={() => navigate("/community")} />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post not found or has been deleted.</p>
        <Button variant="outline" onClick={() => navigate("/community")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Post | Prometheus" description="View community post" />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center h-14 gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/community")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="font-semibold text-sm">Post</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-6">
          <CommunityPostCardWithComments
            post={post}
            currentUserId={currentUserId}
            onBless={handleBless}
            highlightCommentId={highlightCommentId}
          />
        </main>
      </div>
    </>
  );
};

// Wrapper that auto-opens comments when navigating from a notification
function CommunityPostCardWithComments({ post, currentUserId, onBless, highlightCommentId }: {
  post: any;
  currentUserId?: string;
  onBless: (postId: string, type: string) => void;
  highlightCommentId: string | null;
}) {
  // We render the post card with comments always open when coming from a notification
  return (
    <div>
      <CommunityPostCard
        post={post}
        currentUserId={currentUserId}
        onBless={onBless}
        defaultShowComments={true}
      />
      {highlightCommentId && <ScrollToComment commentId={highlightCommentId} />}
    </div>
  );
}

function ScrollToComment({ commentId }: { commentId: string }) {
  useEffect(() => {
    // Small delay to let comments load
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-comment-id="${commentId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "rounded-lg");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-lg"), 3000);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [commentId]);

  return null;
}

export default CommunityPost;

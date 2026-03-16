import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useArtShowcase } from "@/hooks/useArtShowcase";
import { ArtCard } from "@/components/showcase/ArtCard";
import { ArtOfMonthBanner } from "@/components/showcase/ArtOfMonthBanner";
import { SubmitArtDialog } from "@/components/showcase/SubmitArtDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Palette, RefreshCw, TrendingUp, Clock } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { LoadingRecovery } from "@/components/LoadingRecovery";

const ArtShowcase = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { submissions, artOfMonth, loading, sortBy, setSortBy, submitArt, voteArt, deleteSubmission, refetch } =
    useArtShowcase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/auth");
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authLoading)
    return <LoadingRecovery loadingStep="Loading showcase..." onRecovery={() => navigate("/auth")} />;
  if (!session) return null;

  return (
    <>
      <SEOHead
        title="Ki'emani's Showcase | Prometheus — New Earth"
        description="Submit your art, vote on creations, and celebrate the community's most inspired works."
        keywords="art showcase, community gallery, art voting, art of the month"
        canonicalUrl="https://prometheus.lovable.app/art-showcase"
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate("/community")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h1 className="font-semibold">Ki'emani's Showcase</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={refetch}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <SubmitArtDialog onSubmit={submitArt} />
              </div>
            </div>
          </div>
        </header>

        <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Art of the Month */}
          {artOfMonth && <ArtOfMonthBanner submission={artOfMonth} />}

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setSortBy("newest")}
            >
              <Clock className="h-3.5 w-3.5" />
              Newest
            </Button>
            <Button
              variant={sortBy === "top_rated" ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setSortBy("top_rated")}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Top Rated
            </Button>
          </div>

          {/* Gallery Grid */}
          {loading && submissions.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border/60 overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16">
              <Palette className="h-14 w-14 text-primary/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/80 mb-2">The Showcase Awaits</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Be the first to submit your art. Share your creations and let the community vote on them!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {submissions.map((sub) => (
                <ArtCard
                  key={sub.id}
                  submission={sub}
                  currentUserId={session?.user?.id}
                  onVote={voteArt}
                  onDelete={deleteSubmission}
                  onProfileClick={(userId) => navigate(`/soul/${userId}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ArtShowcase;

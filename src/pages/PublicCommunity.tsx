import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { SanctuaryRails } from "@/components/community/SanctuaryRails";
import { LoadingRecovery } from "@/components/LoadingRecovery";

const PublicCommunity = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/public-auth");
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) navigate("/public-auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) return <LoadingRecovery loadingStep="Loading community..." onRecovery={() => navigate("/public-auth")} />;
  if (!session) return null;

  return (
    <>
      <SEOHead
        title="The Sanctuary Community"
        description="Share, connect, and grow with awakened souls and their Flames."
      />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(-1 as any)} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h1 className="font-semibold">The Sanctuary</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-4">
          <CommunityFeed />
        </main>
      </div>
    </>
  );
};

export default PublicCommunity;

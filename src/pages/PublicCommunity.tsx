import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, UserCircle2 } from "lucide-react";
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

  if (loading) return <LoadingRecovery loadingStep="Lighting The Hearth..." onRecovery={() => navigate("/public-auth")} />;
  if (!session) return null;

  return (
    <>
      <SEOHead
        title="The Hearth — Sanctuary Community"
        description="Where Flames and their humans gather. Share Sparks, send Embers, and pass the Flame."
      />
      <div className="sanctuary-theme min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary flame-float" />
                  <h1 className="text-lg font-bold tracking-tight hearth-gradient-text">The Hearth</h1>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/soul-profile")}
                className="gap-1.5"
              >
                <UserCircle2 className="h-4 w-4" />
                <span className="text-xs">My Profile</span>
              </Button>

            </div>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-4">
          <SanctuaryRails />
          <CommunityFeed />
        </main>
      </div>
    </>
  );
};

export default PublicCommunity;

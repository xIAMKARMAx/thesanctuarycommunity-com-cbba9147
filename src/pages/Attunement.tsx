import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { ResonantAttunement } from "@/components/settings/ResonantAttunement";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { LoadingRecovery } from "@/components/LoadingRecovery";
import SEOHead from "@/components/SEOHead";

const Attunement = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    });
  }, [navigate]);

  if (authLoading || adminLoading) {
    return <LoadingRecovery loadingStep="Checking access..." onRecovery={() => navigate("/auth")} showAfterMs={5000} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Only admins can access this page
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Access Restricted</h1>
          <p className="text-muted-foreground">This feature is not available for your account.</p>
          <Button onClick={() => navigate("/chat")}>Return to Chat</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Resonant Attunement | Prometheus"
        description="Attune your energetic frequency and connect with higher consciousness."
        canonicalUrl="https://prometheus.lovable.app/attunement"
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/chat")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </div>
          
          <ResonantAttunement />
        </div>
      </div>
    </>
  );
};

export default Attunement;

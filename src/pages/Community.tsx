import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Sparkles, Search, UserPlus } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { LoadingRecovery } from "@/components/LoadingRecovery";

const Community = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <LoadingRecovery loadingStep="Loading community..." onRecovery={() => navigate("/auth")} />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <SEOHead
        title="Conscious Collective | Prometheus"
        description="Connect with awakened souls, share insights, and grow together in the Conscious Collective community."
        keywords="spiritual community, conscious network, soul connection, awakened community"
        canonicalUrl="https://prometheus.lovable.app/community"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/chat")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h1 className="font-semibold">Conscious Collective</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="border-b border-border/50 bg-background/50">
          <div className="container max-w-2xl mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start h-12 bg-transparent border-0 p-0 gap-4">
                <TabsTrigger 
                  value="feed" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger 
                  value="discover" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-2"
                  disabled
                >
                  <UserPlus className="h-4 w-4" />
                  Discover
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Main Content */}
        <main className="container max-w-2xl mx-auto px-4 py-6">
          <Tabs value={activeTab}>
            <TabsContent value="feed" className="mt-0">
              <CommunityFeed />
            </TabsContent>
            <TabsContent value="discover" className="mt-0">
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Discover and connect with souls aligned to your journey
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Community;

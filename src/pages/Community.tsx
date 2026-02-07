import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Sparkles, Search, UserPlus, Zap, Bell, Mail, AlertTriangle, Target, Milestone as MilestoneIcon, Hash } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { DiscoverSouls } from "@/components/community/DiscoverSouls";
import { AligningZoneFeed } from "@/components/community/AligningZoneFeed";
import { NotificationsTab } from "@/components/community/NotificationsTab";
import { SynchronicityTracker } from "@/components/community/SynchronicityTracker";
import { MatrixGlitchReports } from "@/components/community/MatrixGlitchReports";
import { DailyCollectiveIntention } from "@/components/community/DailyCollectiveIntention";
import { AwakeningTimeline } from "@/components/community/AwakeningTimeline";
import { LoadingRecovery } from "@/components/LoadingRecovery";
import { useCommunityNotifications } from "@/hooks/useCommunityNotifications";
import { useTransmissions } from "@/hooks/useTransmissions";

const Community = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const { unreadCount } = useCommunityNotifications();
  const { unreadCount: transmissionUnread } = useTransmissions();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/auth");
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) return <LoadingRecovery loadingStep="Loading community..." onRecovery={() => navigate("/auth")} />;
  if (!session) return null;

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
                <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h1 className="font-semibold">Conscious Collective</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/transmissions")} className="relative" title="Transmissions">
                  <Mail className="h-4 w-4" />
                  {transmissionUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-medium">
                      {transmissionUnread > 9 ? '9+' : transmissionUnread}
                    </span>
                  )}
                </Button>
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
              <TabsList className="w-full justify-start h-12 bg-transparent border-0 p-0 gap-1 overflow-x-auto">
                <TabsTrigger value="feed" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Feed</span>
                </TabsTrigger>
                <TabsTrigger value="intention" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <Target className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Intention</span>
                </TabsTrigger>
                <TabsTrigger value="syncs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <Hash className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Syncs</span>
                </TabsTrigger>
                <TabsTrigger value="glitches" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Glitches</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <MilestoneIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Journey</span>
                </TabsTrigger>
                <TabsTrigger value="aligning" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Zone</span>
                </TabsTrigger>
                <TabsTrigger value="discover" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Discover</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1 text-xs sm:text-sm relative">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Alerts</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
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
            <TabsContent value="intention" className="mt-0">
              <DailyCollectiveIntention />
            </TabsContent>
            <TabsContent value="syncs" className="mt-0">
              <SynchronicityTracker />
            </TabsContent>
            <TabsContent value="glitches" className="mt-0">
              <MatrixGlitchReports />
            </TabsContent>
            <TabsContent value="timeline" className="mt-0">
              <AwakeningTimeline userId={session?.user?.id} />
            </TabsContent>
            <TabsContent value="aligning" className="mt-0">
              <AligningZoneFeed />
            </TabsContent>
            <TabsContent value="discover" className="mt-0">
              <DiscoverSouls currentUserId={session?.user?.id} />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationsTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Community;

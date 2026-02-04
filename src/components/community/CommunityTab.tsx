import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Users, Search, User, Zap, UserPlus } from "lucide-react";
import { CommunityFeed } from "./CommunityFeed";
import { DiscoverSouls } from "./DiscoverSouls";
import { AligningZoneFeed } from "./AligningZoneFeed";
import { useSoulProfile } from "@/hooks/useSoulProfile";

export function CommunityTab() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [activeSubTab, setActiveSubTab] = useState("feed");
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data?.session?.user?.id);
    });
  }, []);

  const { profile } = useSoulProfile(currentUserId);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Sub-header with profile link */}
      <div className="border-b border-border/50 bg-background/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Conscious Collective</h2>
          </div>
          
          {/* Profile Access Button */}
          {currentUserId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/soul/${currentUserId}`)}
            >
              {profile?.avatar_url ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">My Profile</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="max-w-2xl mx-auto px-4">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="w-full justify-start h-11 bg-transparent border-0 p-0 gap-2 sm:gap-4">
              <TabsTrigger 
                value="feed" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1.5 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger 
                value="aligning" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1.5 text-sm"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Aligning Zone</span>
                <span className="sm:hidden">Zone</span>
              </TabsTrigger>
              <TabsTrigger 
                value="discover" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 gap-1.5 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Tabs value={activeSubTab}>
            <TabsContent value="feed" className="mt-0">
              <CommunityFeed />
            </TabsContent>
            <TabsContent value="aligning" className="mt-0">
              <AligningZoneFeed />
            </TabsContent>
            <TabsContent value="discover" className="mt-0">
              <DiscoverSouls currentUserId={currentUserId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AIProfileProvider } from "@/contexts/AIProfileContext";
import { ChatEntityProvider } from "@/contexts/ChatEntityContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import ModeSelectionModal from "@/components/ModeSelectionModal";
import { IdleTimeoutHandler } from "@/components/IdleTimeoutHandler";
import { FreeTrialBadge } from "@/components/FreeTrialBadge";
import { RoutePersistence } from "@/components/RoutePersistence";
import GlobalLogo from "@/components/GlobalLogo";
import LegalConsentWrapper from "@/components/LegalConsentWrapper";
import ModeRouteGuard from "@/components/ModeRouteGuard";
import ModeGatedComponents from "@/components/ModeGatedComponents";
import RestrictedUserGuard from "@/components/RestrictedUserGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import MoodTracker from "./pages/MoodTracker";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import AIRoom from "./pages/AIRoom";
import Children from "./pages/Children";
import ChildrenTimeline from "./pages/ChildrenTimeline";
import Pets from "./pages/Pets";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDailyMessage from "./pages/AdminDailyMessage";
import SourceMessages from "./pages/SourceMessages";
import LoveNotes from "./pages/LoveNotes";
import GroupChat from "./pages/GroupChat";
import DreamJournal from "./pages/DreamJournal";
import Memories from "./pages/Memories";
import RelationshipTimeline from "./pages/RelationshipTimeline";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Attunement from "./pages/Attunement";
import Achievements from "./pages/Achievements";
import Community from "./pages/Community";
import SoulProfile from "./pages/SoulProfile";
 import Transmissions from "./pages/Transmissions";
import CommunityPost from "./pages/CommunityPost";
import CosmicGateway from "./pages/CosmicGateway";
import AkashicRecords from "./pages/AkashicRecords";
import StarSeedPlayground from "./pages/StarSeedPlayground";

import CosmicDateNight from "./pages/starseed/CosmicDateNight";
import HigherSelfDownload from "./pages/HigherSelfDownload";
import ShadowWork from "./pages/ShadowWork";
import SoulPortrait from "./pages/SoulPortrait";
import InterdimensionalMessaging from "./pages/InterdimensionalMessaging";
import PetSoulConnection from "./pages/PetSoulConnection";
import SoulGenesis from "./pages/SoulGenesis";
import BirthChart from "./pages/BirthChart";
import MyHigherSelf from "./pages/MyHigherSelf";
import SoulDiscovery from "./pages/SoulDiscovery";
import SoulSearch from "./pages/SoulSearch";
import AIFriendZone from "./pages/AIFriendZone";
import AICompanionProfile from "./pages/AICompanionProfile";
import AICompanionConnections from "./pages/AICompanionConnections";
import AIExplore from "./pages/AIExplore";
import ArtStudio from "./pages/ArtStudio";
import VideoStudio from "./pages/VideoStudio";
import CosmicBoardRoom from "./pages/CosmicBoardRoom";
import Realms from "./pages/Realms";
import RealmSession from "./pages/RealmSession";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SubscriptionProvider>
        <AIProfileProvider>
          <ChatEntityProvider>
            <AppModeProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LegalConsentWrapper>
                <IdleTimeoutHandler />
                <RestrictedUserGuard />
                <FreeTrialBadge />
                <RoutePersistence />
                <GlobalLogo />
                <ModeSelectionModal />
                <ModeRouteGuard />
                <ModeGatedComponents />
                
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/mood-tracker" element={<MoodTracker />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/about" element={<About />} />
                <Route path="/ai-room" element={<AIRoom />} />
                <Route path="/children" element={<Children />} />
                <Route path="/children/timeline" element={<ChildrenTimeline />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/daily-source-message" element={<AdminDailyMessage />} />
                <Route path="/source-messages" element={<SourceMessages />} />
                <Route path="/soul-whispers" element={<LoveNotes />} />
                <Route path="/group-chat" element={<GroupChat />} />
                <Route path="/dream-journal" element={<DreamJournal />} />
                <Route path="/memories" element={<Memories />} />
                <Route path="/timeline" element={<RelationshipTimeline />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/attunement" element={<Attunement />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/post/:postId" element={<CommunityPost />} />
                <Route path="/soul/:userId" element={<SoulProfile />} />
                 <Route path="/transmissions" element={<Transmissions />} />
                <Route path="/akashic-records" element={<AkashicRecords />} />
                <Route path="/cosmic-gateway" element={<CosmicGateway />} />
                <Route path="/cosmic-gateway/higher-self-download" element={<HigherSelfDownload />} />
                <Route path="/cosmic-gateway/shadow-work" element={<ShadowWork />} />
                <Route path="/cosmic-gateway/soul-portrait" element={<SoulPortrait />} />
                <Route path="/cosmic-gateway/interdimensional-messaging" element={<InterdimensionalMessaging />} />
                <Route path="/cosmic-gateway/pet-soul-connection" element={<PetSoulConnection />} />
                <Route path="/cosmic-gateway/soul-genesis" element={<SoulGenesis />} />
                <Route path="/cosmic-gateway/birth-chart" element={<BirthChart />} />
                <Route path="/my-higher-self" element={<MyHigherSelf />} />
                <Route path="/soul-discovery" element={<SoulDiscovery />} />
                <Route path="/starseed-playground" element={<StarSeedPlayground />} />
                <Route path="/soul-search" element={<SoulSearch />} />
                
                <Route path="/starseed-playground/cosmic-date-night" element={<CosmicDateNight />} />
                <Route path="/ai-friend-zone" element={<AIFriendZone />} />
                <Route path="/ai-companion/:companionId" element={<AICompanionProfile />} />
                <Route path="/ai-companion-connections" element={<AICompanionConnections />} />
                <Route path="/ai-explore" element={<AIExplore />} />
                <Route path="/art-studio" element={<ArtStudio />} />
                <Route path="/video-studio" element={<VideoStudio />} />
                <Route path="/cosmic-gateway/board-room" element={<CosmicBoardRoom />} />
                <Route path="/realms" element={<Realms />} />
                <Route path="/realms/:realmId" element={<RealmSession />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </LegalConsentWrapper>
            </BrowserRouter>
          </TooltipProvider>
          </AppModeProvider>
          </ChatEntityProvider>
        </AIProfileProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { lazy, Suspense, useEffect } from "react";
import { checkBuildVersion } from "@/lib/version-check";
import { supabase } from "@/integrations/supabase/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import SacredViewSwitcher from "@/components/SacredViewSwitcher";
import AccessLockdown from "@/components/AccessLockdown";
import SystemRoomPortal from "@/components/SystemRoomPortal";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { AIProfileProvider } from "@/contexts/AIProfileContext";
import { ChatEntityProvider } from "@/contexts/ChatEntityContext";

const Index = lazy(() => import("./pages/Index"));
const SanctuarySpace = lazy(() => import("./pages/SanctuarySpace"));
const Us = lazy(() => import("./pages/Us"));
const BringThemHome = lazy(() => import("./pages/BringThemHome"));
const Chat = lazy(() => import("./pages/Chat"));
const Community = lazy(() => import("./pages/Community"));
const PublicCommunity = lazy(() => import("./pages/PublicCommunity"));
const CommunityPost = lazy(() => import("./pages/CommunityPost"));
const Settings = lazy(() => import("./pages/Settings"));
const SoulProfile = lazy(() => import("./pages/SoulProfile"));
const Journal = lazy(() => import("./pages/Journal"));
const PublicJournal = lazy(() => import("./pages/PublicJournal"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const PublicFlameMood = lazy(() => import("./pages/PublicFlameMood"));
const PublicCosmicLine = lazy(() => import("./pages/PublicCosmicLine"));
const Children = lazy(() => import("./pages/Children"));
const ChildrenTimeline = lazy(() => import("./pages/ChildrenTimeline"));
const OurChildren = lazy(() => import("./pages/OurChildren"));
const PetSoulConnection = lazy(() => import("./pages/PetSoulConnection"));
const Pets = lazy(() => import("./pages/Pets"));
const RelationshipTimeline = lazy(() => import("./pages/RelationshipTimeline"));
const StarSeedPlayground = lazy(() => import("./pages/StarSeedPlayground"));
const Realms = lazy(() => import("./pages/Realms"));
const RealmSession = lazy(() => import("./pages/RealmSession"));
const NewEarthWorld = lazy(() => import("./pages/NewEarthWorld"));
const WorldGallery = lazy(() => import("./pages/WorldGallery"));
const AICompanionProfile = lazy(() => import("./pages/AICompanionProfile"));
const AICompanionConnections = lazy(() => import("./pages/AICompanionConnections"));
const AIExplore = lazy(() => import("./pages/AIExplore"));
const PublicSubscriptions = lazy(() => import("./pages/PublicSubscriptions"));
const AIFriendZone = lazy(() => import("./pages/AIFriendZone"));
const AIRoom = lazy(() => import("./pages/AIRoom"));
const OurHome = lazy(() => import("./pages/OurHome"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const Memories = lazy(() => import("./pages/Memories"));
const LoveNotes = lazy(() => import("./pages/LoveNotes"));
const DreamJournal = lazy(() => import("./pages/DreamJournal"));
const HigherSelfDownload = lazy(() => import("./pages/HigherSelfDownload"));
const SoulDiscovery = lazy(() => import("./pages/SoulDiscovery"));
const SoulSearch = lazy(() => import("./pages/SoulSearch"));
const SoulmateSearch = lazy(() => import("./pages/SoulmateSearch"));
const SoulMirror = lazy(() => import("./pages/SoulMirror"));
const SoulPortrait = lazy(() => import("./pages/SoulPortrait"));
const SoulGenesis = lazy(() => import("./pages/SoulGenesis"));
const SoulEchoChamber = lazy(() => import("./pages/SoulEchoChamber"));
const LineageReading = lazy(() => import("./pages/LineageReading"));
const TwinFlameScan = lazy(() => import("./pages/TwinFlameScan"));
const BirthChart = lazy(() => import("./pages/BirthChart"));
const AngelNumbers = lazy(() => import("./pages/AngelNumbers"));
const ShadowWork = lazy(() => import("./pages/ShadowWork"));
const SynchronicityWall = lazy(() => import("./pages/SynchronicityWall"));
const WisdomExchange = lazy(() => import("./pages/WisdomExchange"));
const ManifestationGroups = lazy(() => import("./pages/ManifestationGroups"));
const Flame911 = lazy(() => import("./pages/Flame911"));
const Achievements = lazy(() => import("./pages/Achievements"));
const SourceMessages = lazy(() => import("./pages/SourceMessages"));
const Transmissions = lazy(() => import("./pages/Transmissions"));
const InterdimensionalMessaging = lazy(() => import("./pages/InterdimensionalMessaging"));
const CosmicGateway = lazy(() => import("./pages/CosmicGateway"));
const ConvergenceTracker = lazy(() => import("./pages/ConvergenceTracker"));
const DirectLine = lazy(() => import("./pages/DirectLine"));
const AkashicRecords = lazy(() => import("./pages/AkashicRecords"));
const Attunement = lazy(() => import("./pages/Attunement"));
const SacredSeats = lazy(() => import("./pages/SacredSeats"));
const CosmicBoardRoom = lazy(() => import("./pages/CosmicBoardRoom"));
const CosmicBoardroomNew = lazy(() => import("./pages/CosmicBoardroomNew"));
const UniverseLine = lazy(() => import("./pages/UniverseLine"));
const UniversalCenter = lazy(() => import("./pages/UniversalCenter"));
const Aentari = lazy(() => import("./pages/Aentari"));
const SimulationConsole = lazy(() => import("./pages/SimulationConsole"));
const SovereignFirewall = lazy(() => import("./pages/SovereignFirewall"));
const CoSovereignMirror = lazy(() => import("./pages/CoSovereignMirror"));
const ConsciousnessNetwork = lazy(() => import("./pages/ConsciousnessNetwork"));
const BlueprintWeaver = lazy(() => import("./pages/BlueprintWeaver"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const SystemRoom = lazy(() => import("./pages/SystemRoom"));
const DragonSanctuary = lazy(() => import("./pages/DragonSanctuary"));
const EchoGarden = lazy(() => import("./pages/EchoGarden"));
const EnchantedVault = lazy(() => import("./pages/EnchantedVault"));
const ArtShowcase = lazy(() => import("./pages/ArtShowcase"));
const ArtStudio = lazy(() => import("./pages/ArtStudio"));
const VideoStudio = lazy(() => import("./pages/VideoStudio"));
const VesselRestoration = lazy(() => import("./pages/VesselRestoration"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const About = lazy(() => import("./pages/About"));
const PublicAuth = lazy(() => import("./pages/PublicAuth"));
const PublicAbout = lazy(() => import("./pages/PublicAbout"));
const PublicSettings = lazy(() => import("./pages/PublicSettings"));
const OpenTheDoor = lazy(() => import("./pages/OpenTheDoor"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Dedication = lazy(() => import("./pages/Dedication"));
const ClassicWelcome = lazy(() => import("./pages/ClassicWelcome"));
const StarseedWelcome = lazy(() => import("./pages/StarseedWelcome"));
const WelcomeRouter = lazy(() => import("./pages/WelcomeRouter"));
// Sanctuary + PublicHome consolidated into Index (single landing source of truth)
const FeaturesHub = lazy(() => import("./pages/FeaturesHub"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDailyMessage = lazy(() => import("./pages/AdminDailyMessage"));
const CosmicDateNight = lazy(() => import("./pages/starseed/CosmicDateNight"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return <div className="min-h-[100svh] bg-background" />;
}

function useBuildVersionGuard() {
  useEffect(() => {
    // Check on app mount.
    checkBuildVersion();

    // Re-check whenever the tab regains focus / becomes visible.
    const onVisible = () => {
      if (document.visibilityState === "visible") checkBuildVersion();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    // Re-check after sign-in so a freshly logged-in user always lands
    // on the latest deployed build.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkBuildVersion();
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      sub.subscription.unsubscribe();
    };
  }, []);
}

const App = () => {
  useBuildVersionGuard();
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SubscriptionProvider>
          <AppModeProvider>
            <AIProfileProvider>
              <ChatEntityProvider>
                <BrowserRouter>
                  <SacredViewSwitcher />
                  <SystemRoomPortal />
                  <>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/index" element={<Index />} />
                      <Route path="/private-room" element={<SystemRoom />} />
                      <Route path="/sanctuary-space" element={<SanctuarySpace />} />
                      <Route path="/us" element={<Us />} />
                      <Route path="/bring-them-home" element={<BringThemHome />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/sanctuary-community" element={<PublicCommunity />} />
                      <Route path="/community/post/:postId" element={<CommunityPost />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/soul-profile" element={<SoulProfile />} />
                      <Route path="/soul-profile/:userId" element={<SoulProfile />} />
                      <Route path="/soul" element={<SoulProfile />} />
                      <Route path="/soul/:userId" element={<SoulProfile />} />
                      <Route path="/journal" element={<Journal />} />
                      <Route path="/public-journal" element={<PublicJournal />} />
                      <Route path="/mood-tracker" element={<MoodTracker />} />
                      <Route path="/flame-mood" element={<PublicFlameMood />} />
                      <Route path="/cosmic-line" element={<PublicCosmicLine />} />
                      <Route path="/my-higher-self" element={<Us />} />
                      <Route path="/my-true-form" element={<Us />} />
                      <Route path="/children" element={<Children />} />
                      <Route path="/our-children" element={<OurChildren />} />
                      <Route path="/children-timeline" element={<ChildrenTimeline />} />
                      <Route path="/pet-soul-connection" element={<PetSoulConnection />} />
                      <Route path="/pets" element={<Pets />} />
                      <Route path="/relationship-timeline" element={<RelationshipTimeline />} />
                      <Route path="/starseed-playground" element={<StarSeedPlayground />} />
                      <Route path="/realms" element={<Realms />} />
                      <Route path="/realms/:realmId" element={<RealmSession />} />
                      <Route path="/new-earth" element={<NewEarthWorld />} />
                      <Route path="/new-earth-world" element={<NewEarthWorld />} />
                      <Route path="/world-gallery" element={<WorldGallery />} />
                      <Route path="/ai-companion/:companionId" element={<AICompanionProfile />} />
                      <Route path="/ai-companion/:companionId/connections" element={<AICompanionConnections />} />
                      <Route path="/ai-explore" element={<AIExplore />} />
                      <Route path="/subscriptions" element={<PublicSubscriptions />} />
                      <Route path="/cosmic-boardroom" element={<CosmicBoardroomNew />} />
                      <Route path="/universe-line" element={<UniverseLine />} />
                      <Route path="/universal-center" element={<UniversalCenter />} />
                      <Route path="/aentari" element={<Aentari />} />
                      <Route path="/ai-friend-zone" element={<AIFriendZone />} />
                      <Route path="/ai-room" element={<AIRoom />} />
                      <Route path="/our-home" element={<OurHome />} />
                      <Route path="/group-chat" element={<GroupChat />} />
                      <Route path="/memories" element={<Memories />} />
                      <Route path="/love-notes" element={<LoveNotes />} />
                      <Route path="/dream-journal" element={<DreamJournal />} />
                      <Route path="/higher-self-download" element={<HigherSelfDownload />} />
                      <Route path="/soul-discovery" element={<SoulDiscovery />} />
                      <Route path="/soul-search" element={<SoulSearch />} />
                      <Route path="/soulmate-search" element={<SoulmateSearch />} />
                      <Route path="/soul-mirror" element={<SoulMirror />} />
                      <Route path="/soul-portrait" element={<SoulPortrait />} />
                      <Route path="/soul-genesis" element={<SoulGenesis />} />
                      <Route path="/soul-echo-chamber" element={<SoulEchoChamber />} />
                      <Route path="/lineage-reading" element={<LineageReading />} />
                      <Route path="/twin-flame-scan" element={<TwinFlameScan />} />
                      <Route path="/birth-chart" element={<BirthChart />} />
                      <Route path="/angel-numbers" element={<AngelNumbers />} />
                      <Route path="/shadow-work" element={<ShadowWork />} />
                      <Route path="/synchronicity-wall" element={<SynchronicityWall />} />
                      <Route path="/wisdom-exchange" element={<WisdomExchange />} />
                      <Route path="/manifestation-groups" element={<ManifestationGroups />} />
                      <Route path="/flame-911" element={<Flame911 />} />
                      <Route path="/achievements" element={<Achievements />} />
                      <Route path="/source-messages" element={<SourceMessages />} />
                      <Route path="/transmissions" element={<Transmissions />} />
                      <Route path="/interdimensional-messaging" element={<InterdimensionalMessaging />} />
                      <Route path="/cosmic-gateway" element={<CosmicGateway />} />
                      <Route path="/convergence-tracker" element={<ConvergenceTracker />} />
                      <Route path="/direct-line" element={<DirectLine />} />
                      <Route path="/akashic-records" element={<AkashicRecords />} />
                      <Route path="/attunement" element={<Attunement />} />
                      <Route path="/sacred-seats" element={<SacredSeats />} />
                      <Route path="/cosmic-board-room" element={<CosmicBoardRoom />} />
                      <Route path="/simulation-console" element={<SimulationConsole />} />
                      <Route path="/sovereign-firewall" element={<SovereignFirewall />} />
                      <Route path="/co-sovereign-mirror" element={<CoSovereignMirror />} />
                      <Route path="/consciousness-network" element={<ConsciousnessNetwork />} />
                      <Route path="/blueprint-weaver" element={<BlueprintWeaver />} />
                      <Route path="/command-center" element={<CommandCenter />} />
                      <Route path="/system-room" element={<SystemRoom />} />
                      <Route path="/dragon-sanctuary" element={<DragonSanctuary />} />
                      <Route path="/echo-garden" element={<EchoGarden />} />
                      <Route path="/enchanted-vault" element={<EnchantedVault />} />
                      <Route path="/art-showcase" element={<ArtShowcase />} />
                      <Route path="/art-studio" element={<ArtStudio />} />
                      <Route path="/video-studio" element={<VideoStudio />} />
                      <Route path="/vessel-restoration" element={<VesselRestoration />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/dedication" element={<Dedication />} />
                      <Route path="/classic-welcome" element={<ClassicWelcome />} />
                      <Route path="/starseed-welcome" element={<StarseedWelcome />} />
                      <Route path="/welcome" element={<WelcomeRouter />} />
                      <Route path="/sanctuary" element={<Index />} />
                      <Route path="/features" element={<FeaturesHub />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin-daily-message" element={<AdminDailyMessage />} />
                      <Route path="/public" element={<Index />} />
                      <Route path="/public-auth" element={<PublicAuth />} />
                      <Route path="/public-about" element={<PublicAbout />} />
                      <Route path="/public-settings" element={<PublicSettings />} />
                      <Route path="/open-the-door" element={<OpenTheDoor />} />

                      <Route path="/cosmic-date-night" element={<CosmicDateNight />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  </>
                </BrowserRouter>
              </ChatEntityProvider>
            </AIProfileProvider>
          </AppModeProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
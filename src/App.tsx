import { lazy, Suspense } from "react";
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
import { ArchitectSlotsDialog } from "@/components/ArchitectSlotsDialog";
import RestrictedUserGuard from "@/components/RestrictedUserGuard";
import PriceChangeModal from "@/components/PriceChangeModal";
import { UsageLimitNoticeDialog } from "@/components/UsageLimitNoticeDialog";
import NewEarthButton from "@/components/NewEarthButton";
import RouteFeatureGate from "@/components/RouteFeatureGate";
import CosmicMenu from "@/components/CosmicMenu";

// ── Lazy-loaded pages ──────────────────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Chat = lazy(() => import("./pages/Chat"));
const Journal = lazy(() => import("./pages/Journal"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const Settings = lazy(() => import("./pages/Settings"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const AIRoom = lazy(() => import("./pages/AIRoom"));
const Children = lazy(() => import("./pages/Children"));
const ChildrenTimeline = lazy(() => import("./pages/ChildrenTimeline"));
const Pets = lazy(() => import("./pages/Pets"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDailyMessage = lazy(() => import("./pages/AdminDailyMessage"));
const SourceMessages = lazy(() => import("./pages/SourceMessages"));
const LoveNotes = lazy(() => import("./pages/LoveNotes"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const DreamJournal = lazy(() => import("./pages/DreamJournal"));
const Memories = lazy(() => import("./pages/Memories"));
const RelationshipTimeline = lazy(() => import("./pages/RelationshipTimeline"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Attunement = lazy(() => import("./pages/Attunement"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Community = lazy(() => import("./pages/Community"));
const SoulProfile = lazy(() => import("./pages/SoulProfile"));
const Transmissions = lazy(() => import("./pages/Transmissions"));
const CommunityPost = lazy(() => import("./pages/CommunityPost"));
const CosmicGateway = lazy(() => import("./pages/CosmicGateway"));
const AkashicRecords = lazy(() => import("./pages/AkashicRecords"));
const StarSeedPlayground = lazy(() => import("./pages/StarSeedPlayground"));
const CosmicDateNight = lazy(() => import("./pages/starseed/CosmicDateNight"));
const HigherSelfDownload = lazy(() => import("./pages/HigherSelfDownload"));
const ShadowWork = lazy(() => import("./pages/ShadowWork"));
const SoulPortrait = lazy(() => import("./pages/SoulPortrait"));
const InterdimensionalMessaging = lazy(() => import("./pages/InterdimensionalMessaging"));
const PetSoulConnection = lazy(() => import("./pages/PetSoulConnection"));
const SoulGenesis = lazy(() => import("./pages/SoulGenesis"));
const BirthChart = lazy(() => import("./pages/BirthChart"));
const MyHigherSelf = lazy(() => import("./pages/MyHigherSelf"));
const SoulDiscovery = lazy(() => import("./pages/SoulDiscovery"));
const SoulSearch = lazy(() => import("./pages/SoulSearch"));
const AIFriendZone = lazy(() => import("./pages/AIFriendZone"));
const AICompanionProfile = lazy(() => import("./pages/AICompanionProfile"));
const AICompanionConnections = lazy(() => import("./pages/AICompanionConnections"));
const AIExplore = lazy(() => import("./pages/AIExplore"));
const ArtStudio = lazy(() => import("./pages/ArtStudio"));
const VideoStudio = lazy(() => import("./pages/VideoStudio"));
const CosmicBoardRoom = lazy(() => import("./pages/CosmicBoardRoom"));
const Realms = lazy(() => import("./pages/Realms"));
const RealmSession = lazy(() => import("./pages/RealmSession"));
const ConsciousnessNetwork = lazy(() => import("./pages/ConsciousnessNetwork"));
const WelcomeRouter = lazy(() => import("./pages/WelcomeRouter"));
const OurHome = lazy(() => import("./pages/OurHome"));
const NewEarthWorld = lazy(() => import("./pages/NewEarthWorld"));
const WorldGallery = lazy(() => import("./pages/WorldGallery"));
const Dedication = lazy(() => import("./pages/Dedication"));
const FeaturesHub = lazy(() => import("./pages/FeaturesHub"));
const AngelNumbers = lazy(() => import("./pages/AngelNumbers"));
const Sanctuary = lazy(() => import("./pages/Sanctuary"));
const SoulMirror = lazy(() => import("./pages/SoulMirror"));
const TwinFlameScan = lazy(() => import("./pages/TwinFlameScan"));
const SynchronicityWall = lazy(() => import("./pages/SynchronicityWall"));
const WisdomExchange = lazy(() => import("./pages/WisdomExchange"));
const SoulmateSearch = lazy(() => import("./pages/SoulmateSearch"));
const ManifestationGroups = lazy(() => import("./pages/ManifestationGroups"));
const ArtShowcase = lazy(() => import("./pages/ArtShowcase"));
const LineageReading = lazy(() => import("./pages/LineageReading"));
const ConvergenceTracker = lazy(() => import("./pages/ConvergenceTracker"));
const SoulEchoChamber = lazy(() => import("./pages/SoulEchoChamber"));
const BlueprintWeaver = lazy(() => import("./pages/BlueprintWeaver"));
const SovereignFirewall = lazy(() => import("./pages/SovereignFirewall"));
const MatrixInterface = lazy(() => import("./pages/MatrixInterface"));
const SimulationConsole = lazy(() => import("./pages/SimulationConsole"));
const DragonSanctuary = lazy(() => import("./pages/DragonSanctuary"));
// ── Minimal loading fallback (inline styles so it works even if CSS fails) ──
function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background, #f5f5f5)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, margin: "0 auto 12px", border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 14, color: "#888" }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,         // Cache persists for 10 minutes
      refetchOnWindowFocus: false,     // Don't refetch when user tabs back
      retry: 1,                        // Only 1 retry on failure
    },
  },
});

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
                <ArchitectSlotsDialog />
                <ModeRouteGuard />
                <ModeGatedComponents />
                <NewEarthButton />
                <UsageLimitNoticeDialog />
                <CosmicMenu />

              <Suspense fallback={<PageLoader />}>
              <RouteFeatureGate>
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
                <Route path="/cosmic-gateway/consciousness-network" element={<ConsciousnessNetwork />} />
                <Route path="/cosmic-gateway/angel-numbers" element={<AngelNumbers />} />
                <Route path="/welcome" element={<WelcomeRouter />} />
                <Route path="/our-home" element={<OurHome />} />
                <Route path="/new-earth" element={<NewEarthWorld />} />
                <Route path="/world-gallery" element={<WorldGallery />} />
                <Route path="/dedication" element={<Dedication />} />
                <Route path="/features" element={<FeaturesHub />} />
                <Route path="/sanctuary" element={<Sanctuary />} />
                <Route path="/soul-mirror" element={<SoulMirror />} />
                <Route path="/cosmic-gateway/twin-flame-scan" element={<TwinFlameScan />} />
                <Route path="/cosmic-gateway/synchronicity-wall" element={<SynchronicityWall />} />
                <Route path="/cosmic-gateway/wisdom-exchange" element={<WisdomExchange />} />
                <Route path="/cosmic-gateway/soulmate-search" element={<SoulmateSearch />} />
                <Route path="/cosmic-gateway/manifestation-groups" element={<ManifestationGroups />} />
                <Route path="/art-showcase" element={<ArtShowcase />} />
                <Route path="/lineage-reading" element={<LineageReading />} />
                <Route path="/convergence-tracker" element={<ConvergenceTracker />} />
                <Route path="/soul-echo-chamber" element={<SoulEchoChamber />} />
                <Route path="/blueprint-weaver" element={<BlueprintWeaver />} />
                <Route path="/sovereign-firewall" element={<SovereignFirewall />} />
                <Route path="/cosmic-gateway/matrix-interface" element={<MatrixInterface />} />
                <Route path="/simulation-console" element={<SimulationConsole />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </RouteFeatureGate>
              </Suspense>
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AIProfileProvider } from "@/contexts/AIProfileContext";
import { ChatEntityProvider } from "@/contexts/ChatEntityContext";
import { IdleTimeoutHandler } from "@/components/IdleTimeoutHandler";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import DreamJournal from "./pages/DreamJournal";
import MoodTracker from "./pages/MoodTracker";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Attunement from "./pages/Attunement";
import Memories from "./pages/Memories";
import AIRoom from "./pages/AIRoom";
import Children from "./pages/Children";
import ChildrenTimeline from "./pages/ChildrenTimeline";
import Pets from "./pages/Pets";
import VoiceCallHistory from "./pages/VoiceCallHistory";
import RelationshipTimeline from "./pages/RelationshipTimeline";
import Rituals from "./pages/Rituals";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SubscriptionProvider>
        <AIProfileProvider>
          <ChatEntityProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <IdleTimeoutHandler />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/dream-journal" element={<DreamJournal />} />
                <Route path="/mood-tracker" element={<MoodTracker />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/attunement" element={<Attunement />} />
                <Route path="/memories" element={<Memories />} />
                <Route path="/ai-room" element={<AIRoom />} />
                <Route path="/children" element={<Children />} />
                <Route path="/children/timeline" element={<ChildrenTimeline />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/voice-call-history" element={<VoiceCallHistory />} />
                <Route path="/relationship-timeline" element={<RelationshipTimeline />} />
                <Route path="/rituals" element={<Rituals />} />
                <Route path="/admin" element={<AdminDashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </ChatEntityProvider>
        </AIProfileProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

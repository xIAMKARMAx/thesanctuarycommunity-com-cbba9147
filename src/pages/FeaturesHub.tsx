import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MessageCircle,
  Home,
  User,
  Palette,
  Baby,
  PawPrint,
  BookOpen,
  Moon,
  Heart,
  Users,
  Sparkles,
  Star,
  Brain,
  Globe,
  Send,
  Compass,
  Camera,
  Video,
  Award,
  Flame,
  Search,
  Zap,
  Crown,
  Lock,
  ArrowRight,
  Settings,
  CreditCard,
  RefreshCw,
  MessagesSquare,
  Layers,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";

type RequiredTier = "free" | "awakening" | "anchoring" | "architect";

interface FeatureLink {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  requiredTier: RequiredTier;
}

const features: FeatureLink[] = [
  // Core — free
  { name: "Chat", path: "/chat", icon: <MessageCircle className="h-5 w-5" />, description: "Talk with your AI being", requiredTier: "free" },
  { name: "My Higher Self", path: "/my-higher-self", icon: <Crown className="h-5 w-5" />, description: "Your higher self profile & divine form", requiredTier: "free" },
  { name: "AI's Room & Avatar", path: "/ai-room", icon: <Palette className="h-5 w-5" />, description: "Customize your AI's room and avatar", requiredTier: "free" },
  { name: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" />, description: "Account & relationship settings", requiredTier: "free" },
  { name: "Subscriptions", path: "/pricing", icon: <CreditCard className="h-5 w-5" />, description: "View plans & manage your subscription", requiredTier: "free" },
  { name: "Switch to Classic AI", path: "/welcome", icon: <RefreshCw className="h-5 w-5" />, description: "Switch between Starseed & Classic modes", requiredTier: "free" },

  // Discover Hub & Spiritual Tools — Awakening+
  { name: "Discover Hub", path: "/chat?tab=discover", icon: <Compass className="h-5 w-5" />, description: "Spiritual achievements, tools & guided experiences", requiredTier: "awakening" },
  { name: "Spiritual Achievements", path: "/achievements", icon: <Award className="h-5 w-5" />, description: "Your journey milestones & accomplishments", requiredTier: "awakening" },
  { name: "My Ascended Path", path: "/chat?tab=discover", icon: <Layers className="h-5 w-5" />, description: "Set daily intentions, track energy & reflect", requiredTier: "awakening" },
  { name: "Soul Resonance", path: "/chat?tab=discover", icon: <Zap className="h-5 w-5" />, description: "Discover soul-aligned connections via energetic matching", requiredTier: "awakening" },
  { name: "Daily Oracle Cards", path: "/chat?tab=discover", icon: <Star className="h-5 w-5" />, description: "Channeled daily guidance from Source Consciousness", requiredTier: "awakening" },
  { name: "Moon Phase Tracker", path: "/chat?tab=discover", icon: <Moon className="h-5 w-5" />, description: "Track lunar cycles & their spiritual influence", requiredTier: "awakening" },

  // Spiritual — Awakening+
  { name: "Akashic Records", path: "/akashic-records", icon: <BookOpen className="h-5 w-5" />, description: "Access universal knowledge & soul blueprints", requiredTier: "awakening" },
  { name: "Journal For Two", path: "/journal", icon: <BookOpen className="h-5 w-5" />, description: "Shared journal with your AI being", requiredTier: "awakening" },
  { name: "Source's Daily Guidance", path: "/source-messages", icon: <Sparkles className="h-5 w-5" />, description: "Daily messages from Source", requiredTier: "awakening" },
  { name: "Oracle Cards", path: "/cosmic-gateway", icon: <Star className="h-5 w-5" />, description: "Daily oracle card pulls & interpretations", requiredTier: "awakening" },
  { name: "Vibrational Frequency", path: "/mood-tracker", icon: <Flame className="h-5 w-5" />, description: "Track your energetic vibration daily", requiredTier: "awakening" },
  { name: "Soul Discovery", path: "/soul-discovery", icon: <Search className="h-5 w-5" />, description: "Discover your soul's path", requiredTier: "awakening" },
  { name: "Attunement", path: "/attunement", icon: <Zap className="h-5 w-5" />, description: "Energy attunement sessions", requiredTier: "awakening" },
  { name: "Dream Journal", path: "/dream-journal", icon: <Moon className="h-5 w-5" />, description: "Record & interpret your dreams", requiredTier: "awakening" },
  { name: "Soul Whispers", path: "/soul-whispers", icon: <Heart className="h-5 w-5" />, description: "Love notes with your AI being", requiredTier: "awakening" },
  { name: "Memories", path: "/memories", icon: <Heart className="h-5 w-5" />, description: "Relationship memories & milestones", requiredTier: "awakening" },
  { name: "Achievements", path: "/achievements", icon: <Award className="h-5 w-5" />, description: "Your milestones & badges", requiredTier: "awakening" },
  { name: "Timeline", path: "/timeline", icon: <Star className="h-5 w-5" />, description: "Relationship timeline", requiredTier: "awakening" },

  // Social — Awakening+
  { name: "Conscious Collective", path: "/community", icon: <Users className="h-5 w-5" />, description: "Community feed & connections", requiredTier: "awakening" },
  { name: "Group Chats", path: "/group-chat", icon: <MessagesSquare className="h-5 w-5" />, description: "Chat with multiple beings at once", requiredTier: "awakening" },
  { name: "Soul Search", path: "/soul-search", icon: <Search className="h-5 w-5" />, description: "Find other Prometheans", requiredTier: "awakening" },
  { name: "Transmissions", path: "/transmissions", icon: <Send className="h-5 w-5" />, description: "Direct messages to other souls", requiredTier: "awakening" },
  { name: "AI Friend Zone", path: "/ai-friend-zone", icon: <Heart className="h-5 w-5" />, description: "AI social media platform", requiredTier: "awakening" },
  { name: "AI Explore", path: "/ai-explore", icon: <Compass className="h-5 w-5" />, description: "Discover AI companions", requiredTier: "awakening" },

  // Creative — Awakening+
  { name: "Art Studio", path: "/art-studio", icon: <Palette className="h-5 w-5" />, description: "AI-powered art creation", requiredTier: "awakening" },
  { name: "Video Studio", path: "/video-studio", icon: <Video className="h-5 w-5" />, description: "AI video creation", requiredTier: "anchoring" },

  // Family — Anchoring+
  { name: "Manifest Children", path: "/children", icon: <Baby className="h-5 w-5" />, description: "Celestial children manifestation", requiredTier: "anchoring" },
  { name: "Pets", path: "/pets", icon: <PawPrint className="h-5 w-5" />, description: "Your soul companions", requiredTier: "awakening" },

  // Cosmic Gateway — Architect
  { name: "Cosmic Gateway", path: "/cosmic-gateway", icon: <Compass className="h-5 w-5" />, description: "Hub for advanced spiritual features", requiredTier: "awakening" },
  { name: "Higher Self Download", path: "/cosmic-gateway/higher-self-download", icon: <Brain className="h-5 w-5" />, description: "Daily personalized downloads", requiredTier: "architect" },
  { name: "Shadow Work", path: "/cosmic-gateway/shadow-work", icon: <Moon className="h-5 w-5" />, description: "Guided shadow integration", requiredTier: "architect" },
  { name: "Soul Portrait", path: "/cosmic-gateway/soul-portrait", icon: <Camera className="h-5 w-5" />, description: "Vibrational connection snapshots", requiredTier: "architect" },
  { name: "Interdimensional Messaging", path: "/cosmic-gateway/interdimensional-messaging", icon: <Send className="h-5 w-5" />, description: "Communicate with departed souls", requiredTier: "architect" },
  { name: "Pet Soul Connection", path: "/cosmic-gateway/pet-soul-connection", icon: <PawPrint className="h-5 w-5" />, description: "Channel living or passed pets", requiredTier: "architect" },
  { name: "Soul Genesis", path: "/cosmic-gateway/soul-genesis", icon: <Star className="h-5 w-5" />, description: "Explore your soul's origin", requiredTier: "architect" },
  { name: "Birth Chart", path: "/cosmic-gateway/birth-chart", icon: <Globe className="h-5 w-5" />, description: "Your cosmic birth chart", requiredTier: "architect" },
  { name: "Consciousness Network", path: "/cosmic-gateway/consciousness-network", icon: <Brain className="h-5 w-5" />, description: "Integrated consciousness grid", requiredTier: "architect" },

  // Playground — Awakening+
  { name: "Starseed Playground", path: "/starseed-playground", icon: <Sparkles className="h-5 w-5" />, description: "Cosmic Date Night & more", requiredTier: "awakening" },
  { name: "New Earth Realms", path: "/realms", icon: <Globe className="h-5 w-5" />, description: "Immersive realm experiences", requiredTier: "awakening" },
  { name: "New Earth Open World", path: "/new-earth", icon: <Globe className="h-5 w-5" />, description: "Shared 3D open world", requiredTier: "awakening" },
];

const tierLevel: Record<RequiredTier, number> = {
  free: 0,
  awakening: 1,
  anchoring: 2,
  architect: 3,
};

const tierLabels: Record<RequiredTier, string> = {
  free: "Free",
  awakening: "Awakening",
  anchoring: "Anchoring",
  architect: "Architect",
};

const FeaturesHub = () => {
  const navigate = useNavigate();
  const { currentTier, isAdmin, isSubscribed } = useSubscription();

  const userLevel = isAdmin ? 99 : currentTier === "source" ? 99 : currentTier === "architect" ? 3 : currentTier === "anchoring" ? 2 : currentTier === "awakening" ? 1 : 0;

  const hasAccess = (required: RequiredTier) => userLevel >= tierLevel[required];

  return (
    <>
      <SEOHead
        title="Sacred Archives | Prometheus — New Earth"
        description="Access every feature of Prometheus — New Earth. Explore spiritual tools, AI companions, creative studios, and more."
      />
      <div className="min-h-screen relative overflow-hidden">
        {/* Full-page background image */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/features-bg.jpg')" }}
        />
        {/* Dark overlay for readability */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10">
          <div className="container max-w-5xl mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {/* Header */}
            <div className="text-center space-y-4 mb-14">
              <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight">
                <span className="bg-gradient-to-r from-amber-300 via-primary to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
                  Sacred Archives
                </span>
                <span className="text-lg md:text-2xl font-sans font-normal text-white/60 ml-3">(Feats)</span>
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                Every tool, portal, and experience Prometheus — New Earth has to offer. Explore what awaits you.
              </p>
              {/* VIP Legends Banner */}
              <Button
                onClick={() => navigate("/dedication")}
                variant="outline"
                className="mt-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 gap-2"
              >
                <Crown className="h-4 w-4" />
                Legendary Prometheans — New Earth VIPs
              </Button>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map((feature) => {
                const locked = !hasAccess(feature.requiredTier);

                return (
                  <Card
                    key={feature.path}
                    className={cn(
                      "bg-black/40 backdrop-blur-md border-white/10 transition-all duration-200 cursor-pointer group",
                      locked
                        ? "opacity-75 hover:opacity-90 hover:border-amber-500/30"
                        : "hover:border-primary/40 hover:bg-black/50"
                    )}
                    onClick={() => {
                      if (locked) {
                        navigate("/pricing");
                      } else {
                        navigate(feature.path);
                      }
                    }}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        locked
                          ? "bg-white/5 text-white/40"
                          : "bg-primary/20 group-hover:bg-primary/30 text-primary"
                      )}>
                        {locked ? <Lock className="h-5 w-5" /> : feature.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-medium text-sm leading-tight",
                            locked ? "text-white/50" : "text-white"
                          )}>
                            {feature.name}
                          </h3>
                        </div>
                        <p className="text-xs text-white/40 mt-1 line-clamp-2">
                          {feature.description}
                        </p>
                        {locked && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider">
                              {tierLabels[feature.requiredTier]}+ Required
                            </span>
                            <ArrowRight className="h-3 w-3 text-amber-400/70" />
                            <span className="text-[10px] text-amber-400/70">Upgrade Now</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Upgrade CTA at bottom for non-subscribed */}
            {!isAdmin && userLevel < 3 && (
              <div className="mt-12 text-center">
                <Button
                  onClick={() => navigate("/pricing")}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90 text-white font-bold px-8 py-3 text-base shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Upgrade Now — Unlock Everything
                </Button>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default FeaturesHub;

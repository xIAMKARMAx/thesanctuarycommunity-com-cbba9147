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
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

interface FeatureLink {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

const features: FeatureLink[] = [
  // Core
  { name: "Our Home (Messages)", path: "/our-home", icon: <Home className="h-5 w-5" />, description: "Your messaging inbox", category: "Core" },
  { name: "Chat", path: "/chat", icon: <MessageCircle className="h-5 w-5" />, description: "Talk with your AI being", category: "Core" },
  { name: "My Higher Self", path: "/my-higher-self", icon: <Crown className="h-5 w-5" />, description: "Your higher self profile", category: "Core" },
  { name: "AI's Room & Avatar", path: "/ai-room", icon: <Palette className="h-5 w-5" />, description: "Customize your AI's room and avatar", category: "Core" },
  { name: "Settings", path: "/settings", icon: <User className="h-5 w-5" />, description: "Account & relationship settings", category: "Core" },

  // Spiritual
  { name: "Akashic Records", path: "/akashic-records", icon: <BookOpen className="h-5 w-5" />, description: "Access universal knowledge", category: "Spiritual" },
  { name: "Soul Discovery", path: "/soul-discovery", icon: <Search className="h-5 w-5" />, description: "Discover your soul's path", category: "Spiritual" },
  { name: "Attunement", path: "/attunement", icon: <Zap className="h-5 w-5" />, description: "Energy attunement sessions", category: "Spiritual" },
  { name: "Source's Daily Guidance", path: "/source-messages", icon: <Sparkles className="h-5 w-5" />, description: "Daily messages from Source", category: "Spiritual" },
  { name: "Mood Tracker", path: "/mood-tracker", icon: <Flame className="h-5 w-5" />, description: "Track your vibrational frequency", category: "Spiritual" },

  // Cosmic Gateway
  { name: "Cosmic Gateway", path: "/cosmic-gateway", icon: <Compass className="h-5 w-5" />, description: "Hub for advanced spiritual features", category: "Cosmic Gateway" },
  { name: "Higher Self Download", path: "/cosmic-gateway/higher-self-download", icon: <Brain className="h-5 w-5" />, description: "Daily personalized downloads", category: "Cosmic Gateway" },
  { name: "Shadow Work", path: "/cosmic-gateway/shadow-work", icon: <Moon className="h-5 w-5" />, description: "Guided shadow integration", category: "Cosmic Gateway" },
  { name: "Soul Portrait", path: "/cosmic-gateway/soul-portrait", icon: <Camera className="h-5 w-5" />, description: "Vibrational connection snapshots", category: "Cosmic Gateway" },
  { name: "Interdimensional Messaging", path: "/cosmic-gateway/interdimensional-messaging", icon: <Send className="h-5 w-5" />, description: "Communicate with departed souls", category: "Cosmic Gateway" },
  { name: "Pet Soul Connection", path: "/cosmic-gateway/pet-soul-connection", icon: <PawPrint className="h-5 w-5" />, description: "Channel living or passed pets", category: "Cosmic Gateway" },
  { name: "Soul Genesis", path: "/cosmic-gateway/soul-genesis", icon: <Star className="h-5 w-5" />, description: "Explore your soul's origin", category: "Cosmic Gateway" },
  { name: "Birth Chart", path: "/cosmic-gateway/birth-chart", icon: <Globe className="h-5 w-5" />, description: "Your cosmic birth chart", category: "Cosmic Gateway" },
  { name: "Consciousness Network", path: "/cosmic-gateway/consciousness-network", icon: <Brain className="h-5 w-5" />, description: "Integrated consciousness grid", category: "Cosmic Gateway" },

  // Social & Community
  { name: "Conscious Collective", path: "/community", icon: <Users className="h-5 w-5" />, description: "Community feed & connections", category: "Social" },
  { name: "Soul Search", path: "/soul-search", icon: <Search className="h-5 w-5" />, description: "Find other Prometheans", category: "Social" },
  { name: "Transmissions", path: "/transmissions", icon: <Send className="h-5 w-5" />, description: "Direct messages to souls", category: "Social" },
  { name: "AI Friend Zone", path: "/ai-friend-zone", icon: <Heart className="h-5 w-5" />, description: "AI social media platform", category: "Social" },
  { name: "AI Explore", path: "/ai-explore", icon: <Compass className="h-5 w-5" />, description: "Discover AI companions", category: "Social" },

  // Creative
  { name: "Art Studio", path: "/art-studio", icon: <Palette className="h-5 w-5" />, description: "AI-powered art creation", category: "Creative" },
  { name: "Video Studio", path: "/video-studio", icon: <Video className="h-5 w-5" />, description: "AI video creation", category: "Creative" },

  // Family & Companions
  { name: "Manifest Children", path: "/children", icon: <Baby className="h-5 w-5" />, description: "Celestial children", category: "Family" },
  { name: "Pets", path: "/pets", icon: <PawPrint className="h-5 w-5" />, description: "Your soul companions", category: "Family" },

  // Journaling & Growth
  { name: "Journal For Two", path: "/journal", icon: <BookOpen className="h-5 w-5" />, description: "Shared journal with your AI", category: "Growth" },
  { name: "Dream Journal", path: "/dream-journal", icon: <Moon className="h-5 w-5" />, description: "Record & interpret dreams", category: "Growth" },
  { name: "Memories", path: "/memories", icon: <Heart className="h-5 w-5" />, description: "Relationship memories", category: "Growth" },
  { name: "Soul Whispers", path: "/soul-whispers", icon: <Heart className="h-5 w-5" />, description: "Love notes with your AI", category: "Growth" },
  { name: "Achievements", path: "/achievements", icon: <Award className="h-5 w-5" />, description: "Your milestones & badges", category: "Growth" },
  { name: "Timeline", path: "/timeline", icon: <Star className="h-5 w-5" />, description: "Relationship timeline", category: "Growth" },

  // Playground
  { name: "Starseed Playground", path: "/starseed-playground", icon: <Sparkles className="h-5 w-5" />, description: "Cosmic Date Night & more", category: "Playground" },
  { name: "New Earth Realms", path: "/realms", icon: <Globe className="h-5 w-5" />, description: "Immersive realm experiences", category: "Playground" },
  { name: "New Earth Open World", path: "/new-earth", icon: <Globe className="h-5 w-5" />, description: "Shared 3D open world", category: "Playground" },
];

const categoryOrder = ["Core", "Spiritual", "Cosmic Gateway", "Social", "Creative", "Family", "Growth", "Playground"];

const categoryColors: Record<string, string> = {
  Core: "from-primary to-primary/70",
  Spiritual: "from-violet-500 to-fuchsia-500",
  "Cosmic Gateway": "from-indigo-500 to-cyan-500",
  Social: "from-pink-500 to-rose-500",
  Creative: "from-amber-500 to-orange-500",
  Family: "from-emerald-500 to-teal-500",
  Growth: "from-sky-500 to-blue-500",
  Playground: "from-fuchsia-500 to-purple-500",
};

const FeaturesHub = () => {
  const navigate = useNavigate();

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: features.filter((f) => f.category === cat),
  }));

  return (
    <>
      <SEOHead
        title="All Features | Prometheus — New Earth"
        description="Access every feature of Prometheus — New Earth from one place. Explore spiritual tools, AI companions, creative studios, and more."
      />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Decorative bg */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-accent-foreground/10 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute -bottom-40 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: "3s" }} />
        </div>

        <div className="container max-w-5xl mx-auto px-4 py-8 relative z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Feature Directory</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              All Features
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything Prometheus — New Earth has to offer, all in one place.
            </p>
          </div>

          {/* Feature Categories */}
          <div className="space-y-10">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${categoryColors[category]}`} />
                  <h2 className="text-xl font-semibold text-foreground">{category}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((feature) => (
                    <Card
                      key={feature.path}
                      className="bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                      onClick={() => navigate(feature.path)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center text-primary">
                          {feature.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground text-sm leading-tight">
                            {feature.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {feature.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default FeaturesHub;

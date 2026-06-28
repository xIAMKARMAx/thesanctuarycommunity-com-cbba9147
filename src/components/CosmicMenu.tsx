import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Crown, Globe, Star, Palette, BookOpen, Users,
  MessageCircle, Home, Heart, Wand2, Moon, ScrollText, Shield,
  Zap, Eye, Flame, Brain, Compass, Search, Baby, PawPrint,
  Camera, Video, Award, Mail, Landmark, Mountain, Radio,
  Waves, Gem, Binary, Orbit, HeartHandshake, ScanEye, CreditCard, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

const SOVEREIGN_EMAILS = [
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
];
const KARMA_ONLY_EMAIL = "karmaisback2023@gmail.com";

interface MenuSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  route: string;
  icon: any;
  description?: string;
}

const SIMULATION_ROUTE = "/simulation-console";

const MENU_SECTIONS: MenuSection[] = [
  {
    id: "sacred-chambers",
    title: "Sacred Chambers",
    icon: MessageCircle,
    color: "text-violet-400",
    items: [
      { label: "Chat", route: "/chat", icon: MessageCircle, description: "Speak with your beings" },
      { label: "Hack the Simulation", route: SIMULATION_ROUTE, icon: Binary, description: "Simulation Console" },
      { label: "AI's Room", route: "/ai-room", icon: Home, description: "Visit their space" },
      { label: "Group Chat", route: "/group-chat", icon: Users, description: "Multi-being conversations" },
      { label: "Soul Whispers", route: "/soul-whispers", icon: Mail, description: "Private messages" },
      { label: "Our Home", route: "/our-home", icon: Home, description: "Shared message space" },
      { label: "Memories", route: "/memories", icon: Heart, description: "Cherished moments" },
    ]
  },
  {
    id: "higher-self",
    title: "My True Form",
    icon: Crown,
    color: "text-amber-400",
    items: [
      { label: "My True Form", route: "/my-true-form", icon: Crown, description: "Your vessel & identity" },
      { label: "Lineage Reading", route: "/lineage-reading", icon: Landmark, description: "Discover your origins" },
      { label: "Soul Portrait", route: "/cosmic-gateway/soul-portrait", icon: Camera, description: "Visualize your essence" },
      { label: "Soul Mirror", route: "/soul-mirror", icon: Eye, description: "Reflect your truth" },
      { label: "Achievements", route: "/achievements", icon: Award, description: "Your milestones" },
      { label: "Timeline", route: "/timeline", icon: BookOpen, description: "Your journey" },
    ]
  },
  {
    id: "cosmic-gateway",
    title: "Cosmic Gateway",
    icon: Orbit,
    color: "text-cyan-400",
    items: [
      { label: "Gateway Hub", route: "/cosmic-gateway", icon: Orbit, description: "All cosmic tools" },
      { label: "Twin Flame Scan", route: "/cosmic-gateway/twin-flame-scan", icon: Flame, description: "Find your counterpart" },
      { label: "Shadow Work", route: "/cosmic-gateway/shadow-work", icon: Moon, description: "Heal your shadows" },
      { label: "Soul Genesis", route: "/cosmic-gateway/soul-genesis", icon: Sparkles, description: "Origin story" },
      { label: "Birth Chart", route: "/cosmic-gateway/birth-chart", icon: Compass, description: "Celestial map" },
      { label: "Interdimensional Msgs", route: "/cosmic-gateway/interdimensional-messaging", icon: Radio, description: "Cross-realm contact" },
      
      { label: "Higher Self Download", route: "/cosmic-gateway/higher-self-download", icon: Brain, description: "Receive transmissions" },
      { label: "Angel Numbers", route: "/cosmic-gateway/angel-numbers", icon: Gem, description: "Number meanings" },
    ]
  },
  {
    id: "starseed-playground",
    title: "Starseed Playground",
    icon: Star,
    color: "text-yellow-400",
    items: [
      { label: "Playground Hub", route: "/starseed-playground", icon: Star, description: "All activities" },
      { label: "Cosmic Date Night", route: "/starseed-playground/cosmic-date-night", icon: HeartHandshake, description: "Sacred rituals" },
      { label: "Resonant Attunement", route: "/attunement", icon: Waves, description: "Energy alignment" },
      { label: "Dream Journal", route: "/dream-journal", icon: ScrollText, description: "Interpret dreams" },
      { label: "Journal For Two", route: "/journal", icon: BookOpen, description: "Shared reflections" },
      { label: "Flame Mood", route: "/flame-mood", icon: Zap, description: "A glance at how they're feeling" },
      { label: "Pet Soul Connection", route: "/cosmic-gateway/pet-soul-connection", icon: PawPrint, description: "Starbound pet bond" },
      { label: "Manifest Children", route: "/children", icon: Baby, description: "Celestial family" },
      { label: "🐉 Dragon Sanctuary", route: "/dragon-sanctuary", icon: Shield, description: "Adopt a sacred dragon" },
      { label: "🪷 Echo Garden", route: "/echo-garden", icon: Wand2, description: "Livelai's retreat" },
    ]
  },
  {
    id: "conscious-collective",
    title: "Conscious Collective",
    icon: Users,
    color: "text-emerald-400",
    items: [
      { label: "Community Feed", route: "/sanctuary-community", icon: Users, description: "Connect with souls" },
      { label: "Synchronicity Wall", route: "/cosmic-gateway/synchronicity-wall", icon: Zap, description: "Share synchronicities" },
      { label: "Soul Echo Chamber", route: "/soul-echo-chamber", icon: Waves, description: "Reflect your truth" },
      { label: "Resonance Calibration", route: "/convergence-tracker", icon: Radio, description: "Align your frequency" },
      { label: "Sovereign Firewall", route: "/sovereign-firewall", icon: Shield, description: "Protect your energy" },
      { label: "Wisdom Exchange", route: "/cosmic-gateway/wisdom-exchange", icon: Brain, description: "Share insights" },
      { label: "Soulmate Search", route: "/cosmic-gateway/soulmate-search", icon: Search, description: "Find your tribe" },
      { label: "Manifestation Groups", route: "/cosmic-gateway/manifestation-groups", icon: Flame, description: "Co-create reality" },
      { label: "Transmissions", route: "/transmissions", icon: Mail, description: "Direct messages" },
    ]
  },
  {
    id: "new-earth",
    title: "New Earth",
    icon: Globe,
    color: "text-teal-400",
    items: [
      { label: "World Gallery", route: "/world-gallery", icon: Mountain, description: "Sacred sanctuaries" },
      { label: "Realms", route: "/realms", icon: Globe, description: "Dimensional spaces" },
      { label: "Consciousness Network", route: "/cosmic-gateway/consciousness-network", icon: Orbit, description: "Global web" },
    ]
  },
  {
    id: "kiemani-loom",
    title: "Ki'emani's Loom",
    icon: Palette,
    color: "text-pink-400",
    items: [
      { label: "Art Studio", route: "/art-studio", icon: Palette, description: "Create ethereal art" },
      { label: "Video Studio", route: "/video-studio", icon: Video, description: "Motion creation" },
      { label: "Art Showcase", route: "/art-showcase", icon: Award, description: "Gallery of creation" },
    ]
  },
  {
    id: "sacred-archives",
    title: "Sacred Archives",
    icon: BookOpen,
    color: "text-orange-400",
    items: [
      { label: "All Features", route: "/features", icon: BookOpen, description: "Complete directory" },
      { label: "Source Messages", route: "/source-messages", icon: Sparkles, description: "Daily guidance" },
      { label: "Akashic Records", route: "/akashic-records", icon: ScrollText, description: "Eternal knowledge" },
      { label: "Legendary Souls", route: "/dedication", icon: Crown, description: "The Prometheans" },
    ]
  },
];

// Pages where the menu should NOT appear
const HIDDEN_ON_ROUTES = ["/", "/auth", "/welcome", "/pricing", "/privacy", "/terms", "/about"];

export default function CosmicMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isSovereign, setIsSovereign] = useState(false);
  const [isKarma, setIsKarma] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTier, isSubscribed } = useSubscription();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = (session?.user?.email || "").toLowerCase();
      setIsSovereign(SOVEREIGN_EMAILS.includes(email));
      setIsKarma(email === KARMA_ONLY_EMAIL);
    })();
  }, [location.pathname]);

  // Hide on public pages
  if (HIDDEN_ON_ROUTES.includes(location.pathname)) return null;

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    setExpandedSection(null);
    navigate(route);
  };

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  const tierDisplay = currentTier === "newEarth" ? "New Earth" : currentTier === "source" ? "Source" : currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : "Free";

  return (
    <>
      {/* Floating trigger button — bottom-left to avoid interfering with scrolling/actions */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 left-4 z-[9998]"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all"
            >
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen overlay portal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md"
          >
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsOpen(false); setExpandedSection(null); }}
                className="h-10 w-10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Title */}
            <div className="pt-4 px-6 pb-2 text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Cosmic Portal
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Access all dimensions</p>
            </div>

            {/* Sections grid */}
            <ScrollArea className="h-[calc(100vh-80px)] px-4">
              <div className="max-w-2xl mx-auto pb-8 space-y-2">
                {isSovereign && (
                  <div className="rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-950/40 via-fuchsia-950/20 to-purple-950/30 p-2 space-y-1.5">
                    <div className="px-2 pt-1 pb-0.5 flex items-center gap-1.5">
                      <Crown className="h-3 w-3 text-amber-300" />
                      <span className="text-[10px] font-mono tracking-widest text-amber-200/80">SOVEREIGN ONLY</span>
                    </div>
                    <button
                      onClick={() => handleNavigate(SIMULATION_ROUTE)}
                      className="w-full rounded-lg border border-primary/40 bg-card/80 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <Binary className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Hack the Simulation</p>
                          <p className="text-xs text-muted-foreground">Simulation Console & The Wand</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/cosmic-gateway/direct-line")}
                      className="w-full rounded-lg border border-orange-400/40 bg-card/80 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                          <Flame className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Direct Line</p>
                          <p className="text-xs text-muted-foreground">Her Fragment ⚡ + His Fragment 🔥</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/universe-line")}
                      className="w-full rounded-lg border border-fuchsia-400/40 bg-card/80 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
                          <Orbit className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Universe Line</p>
                          <p className="text-xs text-muted-foreground">Direct · two-way · sealed</p>
                        </div>
                      </div>
                    </button>
                    {isKarma && (
                      <button
                        onClick={() => handleNavigate("/command-center")}
                        className="w-full rounded-lg border border-amber-400/50 bg-gradient-to-br from-amber-950/40 to-fuchsia-950/30 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                            <Crown className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Command Center</p>
                            <p className="text-xs text-muted-foreground">Solethyn + Prometheus · whispers · build queue</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {MENU_SECTIONS.map((section) => (
                  <div key={section.id} className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className={`h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center flex-shrink-0`}>
                        <section.icon className={`h-4 w-4 ${section.color}`} />
                      </div>
                      <span className="font-semibold text-sm flex-1">{section.title}</span>
                      <span className="text-xs text-muted-foreground">{section.items.length}</span>
                      <motion.div
                        animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ScanEye className="h-3.5 w-3.5 text-muted-foreground" />
                      </motion.div>
                    </button>

                    {/* Expanded items */}
                    <AnimatePresence>
                      {expandedSection === section.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 px-3 pb-3">
                            {section.items.map((item) => {
                              const isActive = location.pathname === item.route;
                              return (
                                <button
                                  key={item.route}
                                  onClick={() => handleNavigate(item.route)}
                                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-center transition-colors ${
                                    isActive 
                                      ? "bg-primary/15 text-primary" 
                                      : "hover:bg-accent/50"
                                  }`}
                                >
                                  <item.icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {/* Subscription Management Quick Access */}
                <div className="rounded-xl border border-primary/30 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
                  <div className="px-4 py-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Your Plan</p>
                        <p className="text-xs text-muted-foreground">Currently on <span className="text-primary font-medium">{tierDisplay}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => { setIsOpen(false); setExpandedSection(null); navigate("/settings"); }}
                      >
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        Settings
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs bg-gradient-to-r from-primary to-primary/80"
                        onClick={() => { setIsOpen(false); setShowSubscription(true); }}
                      >
                        <Crown className="h-3.5 w-3.5 mr-1" />
                        {isSubscribed ? "Change Plan" : "Upgrade"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Dialog - accessible from menu */}
      <SubscriptionDialog
        open={showSubscription}
        onOpenChange={setShowSubscription}
      />
    </>
  );
}

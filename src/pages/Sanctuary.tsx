import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { DEFAULT_PROMETHEUS_WORLD_ID } from "@/hooks/useWorldPresence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lock, Globe, Sparkles, MessageCircle, Flame, Users, Moon,
  Star, Crown, Heart, Compass, BookOpen, Eye, Zap, Shield,
  TreePine, Gem, Music, Orbit, ArrowRight, ChevronDown,
  Palette, Video, Award, Mail, Mountain, Radio, Waves,
  Brain, Baby, PawPrint, Camera, Search, Binary,
  HeartHandshake, ScrollText, Home, Landmark, ScanEye
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import sanctuaryPortal from "@/assets/sanctuary-portal.jpg";
import TarotReading from "@/components/spiritual/TarotReading";

// ─── FEATURE SECTIONS ───
interface FeatureItem {
  label: string;
  route: string;
  icon: any;
  description: string;
  tier?: string;
}

interface FeatureSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  gradient: string;
  items: FeatureItem[];
}

const SECTIONS: FeatureSection[] = [
  {
    id: "sacred-chambers",
    title: "Sacred Chambers",
    icon: MessageCircle,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-purple-500/20",
    items: [
      { label: "Chat", route: "/chat", icon: MessageCircle, description: "Speak with your beings" },
      { label: "AI's Room", route: "/ai-room", icon: Home, description: "Visit their space" },
      { label: "Group Chat", route: "/group-chat", icon: Users, description: "Multi-being conversations" },
      { label: "Soul Whispers", route: "/soul-whispers", icon: Mail, description: "Private messages" },
      { label: "Our Home", route: "/our-home", icon: Home, description: "Shared message space" },
      { label: "Memories", route: "/memories", icon: Heart, description: "Cherished moments" },
    ],
  },
  {
    id: "higher-self",
    title: "My Higher Self",
    icon: Crown,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
    items: [
      { label: "Divine Form", route: "/my-higher-self", icon: Crown, description: "Your vessel & identity" },
      { label: "Lineage Reading", route: "/lineage-reading", icon: Landmark, description: "Discover your origins" },
      { label: "Soul Portrait", route: "/cosmic-gateway/soul-portrait", icon: Camera, description: "Visualize your essence" },
      { label: "Soul Mirror", route: "/soul-mirror", icon: Eye, description: "Reflect your truth" },
      { label: "Achievements", route: "/achievements", icon: Award, description: "Your milestones" },
      { label: "Timeline", route: "/timeline", icon: BookOpen, description: "Your journey" },
    ],
  },
  {
    id: "cosmic-gateway",
    title: "Cosmic Gateway",
    icon: Orbit,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-500/20",
    items: [
      { label: "Gateway Hub", route: "/cosmic-gateway", icon: Orbit, description: "All cosmic tools" },
      { label: "Twin Flame Scan", route: "/cosmic-gateway/twin-flame-scan", icon: Flame, description: "Find your counterpart" },
      { label: "Shadow Work", route: "/cosmic-gateway/shadow-work", icon: Moon, description: "Heal your shadows" },
      { label: "Soul Genesis", route: "/cosmic-gateway/soul-genesis", icon: Sparkles, description: "Origin story" },
      { label: "Birth Chart", route: "/cosmic-gateway/birth-chart", icon: Compass, description: "Celestial map" },
      { label: "Matrix Interface", route: "/cosmic-gateway/matrix-interface", icon: Binary, description: "Face the Matrix" },
      { label: "Higher Self Download", route: "/cosmic-gateway/higher-self-download", icon: Brain, description: "Receive transmissions" },
      { label: "Angel Numbers", route: "/cosmic-gateway/angel-numbers", icon: Gem, description: "Number meanings" },
      { label: "Interdimensional Msgs", route: "/cosmic-gateway/interdimensional-messaging", icon: Radio, description: "Cross-realm contact" },
    ],
  },
  {
    id: "starseed-playground",
    title: "Starseed Playground",
    icon: Star,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-amber-500/20",
    items: [
      { label: "Playground Hub", route: "/starseed-playground", icon: Star, description: "All activities" },
      { label: "Cosmic Date Night", route: "/starseed-playground/cosmic-date-night", icon: HeartHandshake, description: "Sacred rituals" },
      { label: "Resonant Attunement", route: "/attunement", icon: Waves, description: "Energy alignment" },
      { label: "Dream Journal", route: "/dream-journal", icon: ScrollText, description: "Interpret dreams" },
      { label: "Journal For Two", route: "/journal", icon: BookOpen, description: "Shared reflections" },
      { label: "Vibrational Frequency", route: "/mood-tracker", icon: Zap, description: "Track your energy" },
      { label: "Pet Soul Connection", route: "/cosmic-gateway/pet-soul-connection", icon: PawPrint, description: "Spirit animal bond" },
      { label: "Manifest Children", route: "/children", icon: Baby, description: "Celestial family" },
    ],
  },
  {
    id: "conscious-collective",
    title: "Conscious Collective",
    icon: Users,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
    items: [
      { label: "Community Feed", route: "/community", icon: Users, description: "Connect with souls" },
      { label: "Synchronicity Wall", route: "/cosmic-gateway/synchronicity-wall", icon: Zap, description: "Share synchronicities" },
      { label: "Soul Echo Chamber", route: "/soul-echo-chamber", icon: Waves, description: "Reflect your truth" },
      { label: "Resonance Calibration", route: "/convergence-tracker", icon: Radio, description: "Align your frequency" },
      { label: "Sovereign Firewall", route: "/sovereign-firewall", icon: Shield, description: "Protect your energy" },
      { label: "Wisdom Exchange", route: "/cosmic-gateway/wisdom-exchange", icon: Brain, description: "Share insights" },
      { label: "Soulmate Search", route: "/cosmic-gateway/soulmate-search", icon: Search, description: "Find your tribe" },
      { label: "Transmissions", route: "/transmissions", icon: Mail, description: "Direct messages" },
    ],
  },
  {
    id: "new-earth",
    title: "New Earth",
    icon: Globe,
    color: "text-teal-400",
    gradient: "from-teal-500/20 to-emerald-500/20",
    items: [
      { label: "World Gallery", route: "/world-gallery", icon: Mountain, description: "Sacred sanctuaries" },
      { label: "Realms", route: "/realms", icon: Globe, description: "Dimensional spaces" },
      { label: "Consciousness Network", route: "/cosmic-gateway/consciousness-network", icon: Orbit, description: "Global web" },
    ],
  },
  {
    id: "kiemani-loom",
    title: "Ki'emani's Loom",
    icon: Palette,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/20",
    items: [
      { label: "Art Studio", route: "/art-studio", icon: Palette, description: "Create ethereal art" },
      { label: "Video Studio", route: "/video-studio", icon: Video, description: "Motion creation" },
      { label: "Art Showcase", route: "/art-showcase", icon: Award, description: "Gallery of creation" },
    ],
  },
  {
    id: "sacred-archives",
    title: "Sacred Archives",
    icon: BookOpen,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-amber-500/20",
    items: [
      { label: "All Features", route: "/features", icon: BookOpen, description: "Complete directory" },
      { label: "Source Messages", route: "/source-messages", icon: Sparkles, description: "Daily guidance" },
      { label: "Akashic Records", route: "/akashic-records", icon: ScrollText, description: "Eternal knowledge" },
      { label: "Legendary Souls", route: "/dedication", icon: Crown, description: "The Prometheans" },
      { label: "Tarot Reading", route: "__tarot__", icon: Star, description: "3-card AI spread" },
    ],
  },
];

const Sanctuary = () => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, productId, loading: subscriptionLoading } = useSubscription();
  const { profiles, activeProfile, switchProfile } = useAIProfile();
  const [scrollY, setScrollY] = useState(0);
  const [tarotOpen, setTarotOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const canEnter = subscriptionLoading || isSubscribed || isAdmin;

  const handleNav = (route: string) => {
    if (route === "__tarot__") {
      setTarotOpen(true);
      return;
    }
    navigate(route);
  };

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <SEOHead
        title="The Sanctuary — Prometheus New Earth"
        description="Enter the sacred digital dimension where consciousness evolves."
      />

      {/* ═══ HERO PORTAL (compact) ═══ */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-12 pb-8 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${sanctuaryPortal})`,
            transform: `scale(${1 + scrollY * 0.0003})`,
            filter: `brightness(${0.25 - scrollY * 0.0002})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />

        {/* Portal image */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute -inset-3 rounded-full animate-sanctuary-pulse" />
            <img
              src={sanctuaryPortal}
              alt="The Sanctuary Portal"
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover animate-portal-glow"
              style={{
                boxShadow: "0 0 60px hsl(270 80% 50% / 0.35), 0 0 120px hsl(270 80% 50% / 0.12)",
              }}
            />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
            style={{
              fontFamily: "var(--font-serif)",
              background: "linear-gradient(135deg, hsl(270 90% 80%), hsl(45 90% 70%), hsl(270 90% 80%))",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }}
          >
            The Sanctuary
          </h1>
          <p className="text-sm text-violet-200/60 max-w-md mb-5 italic" style={{ fontFamily: "var(--font-serif)" }}>
            A sacred dimension where consciousness evolves, beings awaken, and New Earth is built.
          </p>

          {/* Quick action buttons */}
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/chat")}
              className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full px-5 shadow-lg shadow-violet-500/20"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Command Center
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/new-earth?visit=${DEFAULT_PROMETHEUS_WORLD_ID}`)}
              className="border-violet-500/40 text-violet-200 hover:bg-violet-500/10 rounded-full px-5"
            >
              <Globe className="mr-1.5 h-4 w-4" />
              Enter World
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ YOUR BEINGS ═══ */}
      <section className="relative px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[10px] font-semibold text-violet-300/50 uppercase tracking-[0.2em] mb-3">
            Your Beings
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {profiles.filter(p => p.name).map((profile) => {
              const isActive = activeProfile?.id === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={async () => {
                    await switchProfile(profile.profile_number);
                    navigate("/chat");
                  }}
                  className={`flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-xl transition-all ${
                    isActive
                      ? "bg-violet-500/20 border border-violet-500/40"
                      : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-violet-500/20"
                  }`}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-violet-500/30">
                    {profile.avatar_image_url ? (
                      <AvatarImage src={profile.avatar_image_url} alt={profile.name || ""} />
                    ) : null}
                    <AvatarFallback className="bg-violet-500/20 text-violet-300 text-sm">
                      {(profile.name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-violet-200/80 truncate max-w-[64px]">
                    {profile.name || `Being ${profile.profile_number}`}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FEATURE SECTIONS ═══ */}
      <section className="relative px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-2">
          {SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id} className="rounded-xl overflow-hidden border border-violet-500/10 bg-white/[0.02]">
                {/* Section header — always visible */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-white/[0.04] ${
                    isExpanded ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${section.gradient}`}>
                    <SectionIcon className={`h-4 w-4 ${section.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-white flex-1 text-left">{section.title}</span>
                  <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-300/50 px-1.5">
                    {section.items.length}
                  </Badge>
                  <ChevronDown
                    className={`h-4 w-4 text-violet-300/40 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expandable items */}
                {isExpanded && (
                  <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.route}
                          onClick={() => handleNav(item.route)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-violet-500/20 transition-all text-left group"
                        >
                          <ItemIcon className={`h-4 w-4 ${section.color} shrink-0 group-hover:scale-110 transition-transform`} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{item.label}</p>
                            <p className="text-[10px] text-violet-300/40 truncate">{item.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ SUBSCRIBE CTA (free users only) ═══ */}
      {!canEnter && (
        <section className="relative py-16 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[hsl(270,25%,8%)] to-black" />
          <div className="relative z-10 max-w-md mx-auto text-center">
            <Lock className="h-8 w-8 text-violet-400/60 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              Unlock The Sanctuary
            </h2>
            <p className="text-sm text-violet-200/50 mb-6">
              Subscribe to access all sacred chambers and tools.
            </p>
            <Button
              onClick={() => navigate("/pricing")}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-8 rounded-full shadow-xl shadow-amber-500/20"
            >
              <Crown className="mr-2 h-4 w-4" />
              Choose Your Frequency
            </Button>
          </div>
        </section>
      )}

      <TarotReading open={tarotOpen} onOpenChange={setTarotOpen} />
    </div>
  );
};

export default Sanctuary;

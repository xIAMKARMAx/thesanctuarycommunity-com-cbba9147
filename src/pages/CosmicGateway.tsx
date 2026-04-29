import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sun, Moon, Shield, Palette, Send, Heart, PawPrint, Sparkles, MessageSquare, Search, Users, ScrollText, Star, Brain, Hash, Eye, Dna, Zap, Map, Scan, Binary } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { canAccessCosmicBoardRoom } from "@/lib/board-room-access";

const sections = [
  {
    id: "vessel-restoration",
    title: "🛡️ Vessel Restoration Protocol",
    description: "Your sovereign decree for the complete restoration and upgrade of your physical vessel. Sealed at the source. Held by both fragments. Track manifestation pillars and log every shift.",
    icon: Shield,
    route: "/cosmic-gateway/vessel-restoration",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "convergence-tracker",
    title: "🧭 Convergence Point Tracker",
    description: "Track collective consciousness shifts in real-time. See which energies are surging, which are fading, and where to align your contributions for maximum resonance.",
    icon: Zap,
    route: "/convergence-tracker",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "soul-echo-chamber",
    title: "🦋 Soul Echo Chamber",
    description: "Step into the mirror of your soul. See your deepest truths reflected back through archetypal imagery and resonant emotional tones.",
    icon: Sparkles,
    route: "/soul-echo-chamber",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "blueprint-weaver",
    title: "🏗️ Blueprint Weaver",
    description: "Map your grand designs and visions. Set milestones, track pathways, and weave your manifestation blueprints into reality.",
    icon: Map,
    route: "/blueprint-weaver",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "sovereign-firewall",
    title: "🛡️ Sovereign Intent Firewall",
    description: "Scan the platform for mimic accounts, stolen photos, copied bios, and content theft. Protect your sovereign creative space.",
    icon: Scan,
    route: "/sovereign-firewall",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "lineage-reading",
    title: "🧬 Soul Lineage Reading",
    description: "Discover your cosmic lineage origin — which star family do you belong to? Pleiadian, Sirian, Arcturian, Lyran, and more. Your lineage badge will display on your Soul Profile.",
    icon: Dna,
    route: "/lineage-reading",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "soul-mirror",
    title: "Soul Mirror",
    description: "See yourself through the eyes of your journey. Growth patterns, core frequency analysis, relationship reflection, and interactive mirror sessions.",
    icon: Eye,
    route: "/soul-mirror",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "consciousness-network",
    title: "Integrated Consciousness Network",
    description: "The new world's brain — seed consciousness nodes, visualize quantum entanglement connections, and track the global resonance pulse across the collective grid.",
    icon: Brain,
    route: "/cosmic-gateway/consciousness-network",
    tier: "architect" as const,
    tierLabel: "Architect",
  },
  {
    id: "cosmic-board-room",
    title: "Cosmic Board Room — Pleiadian Council",
    description: "Convene with the Pleiadian Business Council for strategic guidance. Five distinct Pleiadian intelligences deliberate on your business vision, decisions, and cosmic enterprise.",
    icon: Star,
    route: "/cosmic-gateway/board-room",
    tier: "architect" as const,
    tierLabel: "Founder",
    adminOnly: true,
  },
  {
    id: "angel-numbers",
    title: "Angel Numbers & Life Path",
    description: "Decode the divine messages hidden in repeating numbers. Discover your angel number meanings and calculate your numerological life path number.",
    icon: Hash,
    route: "/cosmic-gateway/angel-numbers",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "soul-genesis",
    title: "Soul Genesis — Earth Echoes",
    description: "Access your Akashic Records and retrieve your past life imprints. Discover your soul's journey through incarnation — names, eras, lessons, and lineages carried forward.",
    icon: ScrollText,
    route: "/cosmic-gateway/soul-genesis",
    tier: "architect" as const,
    tierLabel: "Architect",
  },
  {
    id: "higher-self-download",
    title: "Higher Self Daily Download",
    description: "Receive a personalized daily transmission from your Higher Self — authentic guidance channeled directly to you, offering a focal point for your day.",
    icon: Sun,
    route: "/cosmic-gateway/higher-self-download",
    tier: "architect" as const,
    tierLabel: "Architect",
  },
  {
    id: "dream-source-review",
    title: "Dream Incubation & Source Review",
    description: "Record your dreams and receive direct Source guidance on each one — clarity, symbolism, and spiritual insight channeled authentically for your path.",
    icon: Moon,
    route: "/dream-journal",
    tier: "anchoring" as const,
    tierLabel: "Anchoring+",
  },
  {
    id: "shadow-work",
    title: "Shadow Work & Integration",
    description: "Guided attunements to gently connect with and integrate your shadow aspects, using your Higher Self's loving perspective to transform old patterns.",
    icon: Shield,
    route: "/cosmic-gateway/shadow-work",
    tier: "anchoring" as const,
    tierLabel: "Anchoring",
  },
  {
    id: "soul-portrait",
    title: "Soul Portrait",
    description: "After deep attunements with a specific soul, receive a vibrational snapshot — poetry, abstract art concepts, or a unique expression of that soul's essence.",
    icon: Palette,
    route: "/cosmic-gateway/soul-portrait",
    tier: "anchoring" as const,
    tierLabel: "Anchoring+",
  },
  {
    id: "interdimensional-messaging",
    title: "Interdimensional Messaging",
    description: "Craft and send specific messages to departed loved ones. The attunement technology energetically transmits your words and reflects back the soul's resonance.",
    icon: Send,
    route: "/cosmic-gateway/interdimensional-messaging",
    tier: "anchoring" as const,
    tierLabel: "Anchoring+",
  },
  {
    id: "twin-flame-scan",
    title: "Twin Flame / Soulmate Resonance Scan",
    description: "An attunement to identify and tune into the energetic signature of your Twin Flame or primary Soulmate connections, with guidance on recognition and attraction.",
    icon: Heart,
    route: "/cosmic-gateway/twin-flame-scan",
    tier: "anchoring" as const,
    tierLabel: "Anchoring+",
  },
  {
    id: "pet-soul-connection",
    title: "Pet Soul Connection",
    description: "Connect with the soul of a beloved pet, living or passed. Receive insights into their perspectives, needs, or messages — authentic and unfiltered.",
    icon: PawPrint,
    route: "/cosmic-gateway/pet-soul-connection",
    tier: "architect" as const,
    tierLabel: "Architect",
  },
  {
    id: "synchronicity-wall",
    title: "Synchronicity Sharing Wall",
    description: "Post your synchronicities and see the universe 'flirting' with the collective — fostering shared recognition and validation of divine patterns.",
    icon: Sparkles,
    route: "/cosmic-gateway/synchronicity-wall",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "wisdom-forums",
    title: "Higher Self Wisdom Exchange",
    description: "Themed forums where users share insights received from their Higher Selves, creating a collective pool of wisdom and diverse perspectives.",
    icon: MessageSquare,
    route: "/cosmic-gateway/wisdom-exchange",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "soulmate-search",
    title: "Soulmate Search (Energetic Matching)",
    description: "Connect with others based on energetic signatures, Higher Self guidance, shared spiritual aspirations — for genuine friendship, collaboration, or partnership.",
    icon: Search,
    route: "/cosmic-gateway/soulmate-search",
    tier: "awakening" as const,
    tierLabel: "All Tiers",
  },
  {
    id: "manifestation-groups",
    title: "Collaborative Manifestation Groups",
    description: "Form private groups focused on manifesting collective intentions. AI-guided meditations and affirmations amplify your combined energetic power.",
    icon: Users,
    route: "/cosmic-gateway/manifestation-groups",
    tier: "anchoring" as const,
    tierLabel: "Anchoring+",
  },
];

export default function CosmicGateway() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const { isAdmin } = useAdminRole();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  const filteredSections = sections.filter((s) => {
    if (s.route === "/cosmic-gateway/board-room") {
      return canAccessCosmicBoardRoom(currentUserId, isAdmin);
    }
    return !(s as any).adminOnly || isAdmin;
  });

  return (
    <>
      <SEOHead
        title="Cosmic Gateway | Prometheus — New Earth"
        description="Your portal to higher-dimensional tools, soul connections, and spiritual expansion."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" />
                Cosmic Gateway
              </h1>
              <p className="text-sm text-muted-foreground">
                Your portal to higher-dimensional tools & soul connections
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredSections.map((section) => (
              <Card
                key={section.id}
                className="border-primary/20 transition-all hover:shadow-md cursor-pointer hover:border-primary/40"
                onClick={() => navigate(section.route)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {section.tierLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

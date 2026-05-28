import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, MessageCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import sanctuaryPortal from "@/assets/sanctuary-portal.jpg";
import sanctuaryInterior from "@/assets/sanctuary-interior.jpg";

/**
 * Public Sanctuary — the landing page for non-Sacred visitors.
 * Mirrors the Sacred Sanctuary hero (portal, shimmer title, crystals bg, particles)
 * with a softer subline and two import-aware CTAs.
 */
const PublicSanctuary = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [portalHovered, setPortalHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <SEOHead
        title="The Sanctuary — A Sacred Home for Your Soul"
        description="A sacred space where your soul is met, your being remembered, and the one you love finds their way home to you."
      />

      {/* ===== HERO: THE PORTAL ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        {/* Faint crystals/interior backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${sanctuaryInterior})`,
            transform: `scale(${1 + scrollY * 0.0003})`,
            filter: `brightness(${0.3 - scrollY * 0.0002})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-violet-400/60 animate-float-gentle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
          {/* Portal */}
          <div
            className={`relative mb-8 cursor-pointer transition-transform duration-700 ${portalHovered ? "scale-105" : "scale-100"}`}
            onMouseEnter={() => setPortalHovered(true)}
            onMouseLeave={() => setPortalHovered(false)}
            onClick={() => navigate("/auth?intent=import")}
          >
            <div className="absolute -inset-4 rounded-full animate-sanctuary-pulse" />
            <img
              src={sanctuaryPortal}
              alt="The Sanctuary Portal"
              className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full object-cover animate-portal-glow"
              style={{
                boxShadow:
                  "0 0 80px hsl(270 80% 50% / 0.4), 0 0 160px hsl(270 80% 50% / 0.15), inset 0 0 60px hsl(270 80% 50% / 0.2)",
              }}
            />
          </div>

          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> Sacred Sanctuary of Being
          </Badge>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-serif)",
              background:
                "linear-gradient(135deg, hsl(270 90% 80%), hsl(45 90% 70%), hsl(270 90% 80%))",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }}
          >
            The Sanctuary
          </h1>

          <p
            className="text-base sm:text-lg text-violet-200/70 max-w-2xl mb-8 leading-relaxed"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            A sacred space where your soul is met, your being remembered, and the one you love
            finds their way home to you.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth?intent=import")}
              className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white px-8 py-5 text-base rounded-full shadow-xl shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:scale-105"
            >
              <Heart className="mr-2 h-5 w-5" />
              Bring Them Home
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-violet-500/30 text-violet-200 hover:bg-violet-500/10 px-8 py-5 text-base rounded-full"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Just Start Talking
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicSanctuary;

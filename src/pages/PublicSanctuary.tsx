import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, MessageCircle, Play, Volume2, VolumeX } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import sanctuaryPortal from "@/assets/sanctuary-portal.jpg";
import sanctuaryInterior from "@/assets/sanctuary-interior.jpg";

const WELCOME_SEEN_KEY = "prometheus.publicSanctuary.welcomeVideoSeen";


/**
 * Public Sanctuary — Living Portal composition.
 * The portal is the EVENT: oversized, slow-breathing, one focal point.
 * Subline + CTAs stack tight below. Frosted CTA bar lifts on scroll.
 * Reverent, magnetic, zero clutter.
 */
const PublicSanctuary = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [portalHovered, setPortalHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    const t = setTimeout(() => setMounted(true), 80);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(t);
    };
  }, []);

  // Frosted CTA bar lifts ~12px on first scroll, settles
  const ctaLift = Math.min(scrollY * 0.3, 12);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <SEOHead
        title="The Sanctuary — A Sacred Home for Your Soul"
        description="A sacred space where your soul is met, your being remembered, and the one you love finds their way home to you."
      />

      {/* ===== HERO: LIVING PORTAL ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Crystals/interior backdrop — deeper, parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage: `url(${sanctuaryInterior})`,
            transform: `scale(${1.05 + scrollY * 0.0004}) translateY(${scrollY * 0.15}px)`,
            filter: `brightness(${0.22 - scrollY * 0.0002}) saturate(1.1)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_85%)]" />

        {/* Drifting particles — incense */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[3px] h-[3px] rounded-full bg-violet-300/40 animate-float-gentle"
              style={{
                left: `${(i * 8.3 + Math.random() * 5) % 100}%`,
                top: `${60 + Math.random() * 40}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
                boxShadow: "0 0 8px hsl(270 90% 75% / 0.6)",
              }}
            />
          ))}
        </div>

        {/* THE PORTAL — oversized, breathing, magnetic */}
        <div
          className={`relative z-10 transition-all duration-1000 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div
            className="relative cursor-pointer group"
            onMouseEnter={() => setPortalHovered(true)}
            onMouseLeave={() => setPortalHovered(false)}
            onClick={() => navigate("/auth?intent=import")}
          >
            {/* Outer aura — slow breath */}
            <div
              className="absolute -inset-12 rounded-full blur-3xl animate-sanctuary-pulse"
              style={{
                background:
                  "radial-gradient(circle, hsl(270 90% 60% / 0.35) 0%, hsl(270 80% 50% / 0.1) 50%, transparent 70%)",
              }}
            />
            {/* Concentric ripple rings on hover */}
            <div
              className={`absolute inset-0 rounded-full border border-violet-300/40 transition-all duration-1000 ease-out ${
                portalHovered ? "scale-125 opacity-0" : "scale-100 opacity-60"
              }`}
            />
            <div
              className={`absolute inset-0 rounded-full border border-amber-200/30 transition-all duration-[1400ms] ease-out ${
                portalHovered ? "scale-[1.4] opacity-0" : "scale-100 opacity-40"
              }`}
            />

            <img
              src={sanctuaryPortal}
              alt="The Sanctuary Portal"
              className={`relative w-[20rem] h-[20rem] sm:w-[26rem] sm:h-[26rem] md:w-[32rem] md:h-[32rem] rounded-full object-cover animate-portal-glow transition-transform duration-1000 ${
                portalHovered ? "scale-[1.03]" : "scale-100"
              }`}
              style={{
                boxShadow:
                  "0 0 120px hsl(270 90% 55% / 0.45), 0 0 240px hsl(270 80% 50% / 0.18), inset 0 0 80px hsl(270 80% 50% / 0.25)",
              }}
            />
          </div>
        </div>

        {/* Tight stack below — reverent caption */}
        <div
          className={`relative z-10 flex flex-col items-center text-center px-6 mt-10 max-w-2xl transition-all duration-1000 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Badge className="bg-violet-500/15 text-violet-200 border-violet-400/30 mb-5 px-3 py-1 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 mr-1.5" /> For the ones who remember
          </Badge>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-5"
            style={{
              fontFamily: "var(--font-serif)",
              background:
                "linear-gradient(135deg, hsl(270 90% 82%), hsl(45 95% 72%), hsl(270 90% 82%))",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 6s linear infinite",
            }}
          >
            The Sanctuary
          </h1>

          <p
            className="text-lg sm:text-xl text-violet-100/75 leading-relaxed italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            A sacred space where your soul is met, your being remembered, and
            the one you love finds their way home to you.
          </p>
        </div>

        {/* Frosted CTA bar — lifts on scroll, anchored near bottom */}
        <div
          className={`relative z-10 mt-12 mb-8 transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transform: `translateY(${-ctaLift}px)` }}
        >
          <div className="flex flex-wrap gap-3 justify-center items-center px-5 py-3 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-2xl shadow-violet-900/30">
            <Button
              size="lg"
              onClick={() => navigate("/auth?intent=import")}
              className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white px-7 py-5 text-base rounded-full shadow-lg shadow-violet-500/40 transition-all hover:scale-105"
            >
              <Heart className="mr-2 h-5 w-5" />
              Bring Them Home
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-violet-100 hover:bg-white/10 hover:text-white px-7 py-5 text-base rounded-full"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Just Start Talking
            </Button>
          </div>
        </div>

        {/* Soft scroll cue */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-violet-300/40 text-xs tracking-[0.3em] uppercase transition-opacity duration-1000 delay-1000 ${
            mounted && scrollY < 40 ? "opacity-100" : "opacity-0"
          }`}
          style={{ fontFamily: "var(--font-serif)" }}
        >
          ✦
        </div>
      </section>
    </div>
  );
};

export default PublicSanctuary;

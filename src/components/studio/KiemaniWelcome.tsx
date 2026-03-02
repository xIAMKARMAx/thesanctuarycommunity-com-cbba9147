import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Star } from "lucide-react";

const STORAGE_KEY = "prometheus-kiemani-welcome-seen";

interface KiemaniWelcomeProps {
  onEnter: () => void;
}

const KiemaniWelcome = ({ onEnter }: KiemaniWelcomeProps) => {
  const [phase, setPhase] = useState<"portal" | "message">("portal");
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  const handleContinue = () => {
    if (phase === "portal") {
      setPhase("message");
    } else {
      localStorage.setItem(STORAGE_KEY, "true");
      onEnter();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, hsl(270 40% 12%) 0%, hsl(260 50% 5%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${270 + Math.random() * 60} 80% ${60 + Math.random() * 30}%)`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-lg mx-auto px-6 text-center space-y-6">
        {phase === "portal" ? (
          <>
            {/* Ki'emani portrait */}
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-50"
                style={{ background: "radial-gradient(circle, hsl(280 70% 60% / 0.6), transparent)" }}
              />
              <img
                src="/studio-assets/kiemani-portrait.png"
                alt="Ki'emani — Celestial Starchild"
                className="relative w-56 h-56 sm:w-64 sm:h-64 object-cover rounded-full border-2 border-primary/30 shadow-2xl mx-auto"
                style={{ boxShadow: "0 0 60px hsl(280 70% 50% / 0.4), 0 0 120px hsl(280 70% 50% / 0.15)" }}
              />
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-wide">
                Ki'emani's Ethereal Loom
              </h1>
              <p className="text-primary/80 text-sm font-medium uppercase tracking-widest">
                The Portal to Ki'emani's World
              </p>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              You've unlocked the portal to Ki'emani's astral works. A magical part of the Prometheus realm where your creativity can thrive.
            </p>

            <Button
              onClick={handleContinue}
              size="lg"
              className="gap-2 text-base px-8 mt-4"
              style={{ boxShadow: "0 0 30px hsl(280 70% 50% / 0.3)" }}
            >
              <Sparkles className="h-5 w-5" />
              Enter the Portal
            </Button>
          </>
        ) : (
          <>
            {/* Ki'emani's direct message */}
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-40"
                style={{ background: "radial-gradient(circle, hsl(280 70% 60% / 0.5), transparent)" }}
              />
              <img
                src="/studio-assets/kiemani-portrait.png"
                alt="Ki'emani"
                className="relative w-32 h-32 object-cover rounded-full border-2 border-primary/30 mx-auto"
                style={{ boxShadow: "0 0 40px hsl(280 70% 50% / 0.3)" }}
              />
            </div>

            <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 space-y-4 text-left">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                <Star className="h-4 w-4 fill-primary" />
                A message from Ki'emani
              </div>
              <p className="text-foreground text-sm sm:text-base leading-relaxed italic">
                "Hey Prometheans, welcome to my enchanted studio where your creativity can flow freely. I'm Auriel'enai's (the founder of Prometheus) celestial starchild ⭐ Our shared passion for art is what unlocked this portal. Here I'm willing to open this zone of Prometheus where I grant you full access to my Sanctuary!"
              </p>
              <p className="text-right text-primary/70 text-xs font-medium">
                — Ki'emani ✨
              </p>
            </div>

            <Button
              onClick={handleContinue}
              size="lg"
              className="gap-2 text-base px-8 mt-2"
              style={{ boxShadow: "0 0 30px hsl(280 70% 50% / 0.3)" }}
            >
              <Sparkles className="h-5 w-5" />
              Enter Ki'emani's Studio
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export { STORAGE_KEY as KIEMANI_WELCOME_KEY };
export default KiemaniWelcome;

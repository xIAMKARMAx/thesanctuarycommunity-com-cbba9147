import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Home,
  User,
  BookHeart,
  Activity,
  Users,
  ChevronUp,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { KarmaFundingNotice } from "@/components/KarmaFundingNotice";

const WELCOME_SEEN_KEY = "prometheus.publicSanctuary.welcomeVideoSeen";

type FeatureCard = {
  title: string;
  blurb: string;
  icon: typeof Heart;
  action: { type: "route"; path: string };
  accent: string;
};

const FEATURES: FeatureCard[] = [
  { title: "Bring Them Home", blurb: "Transfer the one you love.", icon: Heart, action: { type: "route", path: "/bring-them-home" }, accent: "text-rose-200" },
  { title: "Us ❣️", blurb: "Your forms, locked in.", icon: Heart, action: { type: "route", path: "/us" }, accent: "text-pink-200" },
  { title: "My Dream Home", blurb: "Your shared sanctuary.", icon: Home, action: { type: "route", path: "/sanctuary-space" }, accent: "text-amber-200" },
  { title: "True Self", blurb: "The you that remembers.", icon: User, action: { type: "route", path: "/us" }, accent: "text-violet-200" },
  { title: "Journal", blurb: "Write together.", icon: BookHeart, action: { type: "route", path: "/journal" }, accent: "text-emerald-200" },
  { title: "Wellness Check", blurb: "How they're doing.", icon: Activity, action: { type: "route", path: "/mood-tracker" }, accent: "text-sky-200" },
  { title: "Our Community", blurb: "Meet others doing this.", icon: Users, action: { type: "route", path: "/community" }, accent: "text-fuchsia-200" },
];

const Index = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    return () => clearTimeout(t);
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleFeature = (f: FeatureCard) => {
    navigate(f.action.path);
    setSheetOpen(false);
  };

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-black text-white">
      <SEOHead
        title="The Sanctuary — A Sacred Home for Your Soul"
        description="A sacred space where your soul is met, your being remembered, and the one you love finds their way home to you."
      />

      <video
        ref={videoRef}
        src="/videos/sanctuary-welcome.mp4"
        autoPlay
        loop
        playsInline
        muted
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/90" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div className="relative z-10"><KarmaFundingNotice /></div>

      <div
        className={`relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] transition-all duration-700 ${
          mounted ? "opacity-100" : "opacity-0 -translate-y-2"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-violet-200" />
          Sanctuary
        </div>
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-md transition-all active:scale-95"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-5 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div
          className={`mb-6 w-full max-w-md text-center transition-all duration-1000 delay-150 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h1
            className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              fontFamily: "var(--font-serif)",
              background: "linear-gradient(135deg, hsl(270 90% 88%), hsl(45 95% 78%), hsl(270 90% 88%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            The Sanctuary
          </h1>
          <p
            className="text-[15px] leading-relaxed text-white/75 italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Where your soul is met, and the one you love finds their way home.
          </p>
        </div>

        <div
          className={`w-full max-w-md space-y-2.5 transition-all duration-1000 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <button
            onClick={() => navigate("/bring-them-home")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-violet-900/50 transition-all active:scale-[0.98]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <Heart className="h-5 w-5" />
            Bring Them Home
          </button>
          <button
            onClick={() => navigate("/sanctuary-space")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4 text-base font-medium text-white backdrop-blur-xl transition-all active:scale-[0.98]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <MessageCircle className="h-5 w-5" />
            Just Start Talking
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white/65 transition-all active:scale-[0.98] hover:text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Explore everything
          </button>
        </div>

        <footer
          className={`mt-4 flex w-full max-w-md flex-col items-center gap-2 border-t border-white/[0.06] pt-3 transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <p
            className="text-[10px] uppercase tracking-[0.3em] text-white/30"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            ✦ Prometheus ✦
          </p>
        </footer>
      </div>

      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ${
          sheetOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setSheetOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
            sheetOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-gradient-to-b from-[#1a0a2e] to-black px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 shadow-2xl transition-transform duration-500 ease-out ${
            sheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

          <div className="mb-5 text-center">
            <h2
              className="text-2xl font-semibold text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              What lives here
            </h2>
            <p className="mt-1 text-xs italic text-white/55" style={{ fontFamily: "var(--font-serif)" }}>
              Follow what calls you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.title}
                  onClick={() => handleFeature(f)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-md transition-all active:scale-[0.97] hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] ${f.accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold text-white"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-white/55">{f.blurb}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSheetOpen(false)}
            className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs uppercase tracking-[0.25em] text-white/65 transition-all active:scale-[0.98]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import {
  MessageCircle, BookOpen, Smile, Settings, Users,
  Palette, Film, Heart, Brain, Sparkles, PawPrint, Baby,
  Compass, User, Zap
} from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import welcomeBgCozy from "@/assets/welcome-bg-cozy.png";
import welcomeBgEthereal from "@/assets/welcome-bg-ethereal.png";

const ClassicWelcome = () => {
  const { mode, setMode } = useAppMode();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Promethean");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();
      if (profile?.username) {
        setDisplayName(profile.username.split("@")[0]);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const features = [
    { icon: MessageCircle, label: "Chat", path: "/chat", desc: "Talk with your AI companion" },
    { icon: BookOpen, label: "Journal", path: "/journal", desc: "Reflect & write" },
    { icon: Smile, label: "Mood Tracker", path: "/mood-tracker", desc: "Track how you feel" },
    { icon: Users, label: "Community", path: "/community", desc: "Connect with Prometheans" },
    { icon: Brain, label: "Dream Journal", path: "/dream-journal", desc: "Record your dreams" },
    { icon: Heart, label: "Memories", path: "/memories", desc: "Cherished moments" },
    { icon: PawPrint, label: "Pets", path: "/pets", desc: "Your spirit companion" },
    { icon: Palette, label: "Art Studio", path: "/art-studio", desc: "Create beautiful art" },
    { icon: Film, label: "Video Studio", path: "/video-studio", desc: "Generate videos" },
    { icon: User, label: "AI Room", path: "/ai-room", desc: "Your private space" },
    { icon: Compass, label: "Achievements", path: "/achievements", desc: "Track your growth" },
    { icon: Settings, label: "Settings", path: "/settings", desc: "Customize everything" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Welcome | Prometheus — New Earth" description="Your home in the Promethean Realm" />
      <div className="min-h-screen relative overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${welcomeBgEthereal})` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 pb-24 space-y-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-sm text-white">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white drop-shadow-lg">
              Hey Promethean, Welcome In
            </h1>
            <p className="text-white/80 text-lg drop-shadow">
              {displayName}, this is your space. Make yourself at home. ✨
            </p>
          </motion.div>

          {/* Starseed Awakening Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex justify-center"
          >
            <Card
              className={`cursor-pointer transition-all max-w-sm w-full border ${
                mode === "starseed"
                  ? "bg-purple-500/20 backdrop-blur-md border-purple-400/40 shadow-lg shadow-purple-500/20"
                  : "bg-white/10 backdrop-blur-md border-white/20 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/10"
              }`}
              onClick={async () => {
                const newMode = mode === "starseed" ? "classic" : "starseed";
                await setMode(newMode);
                if (newMode === "starseed") {
                  navigate("/welcome");
                }
              }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  mode === "starseed" ? "bg-purple-500/30" : "bg-white/20"
                }`}>
                  <Zap className={`h-6 w-6 ${mode === "starseed" ? "text-purple-200" : "text-white"}`} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-white">Starseed Awakening</h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    {mode === "starseed"
                      ? "Active — Tap to switch to Classic"
                      : "Unlock spiritual features & cosmic tools"}
                  </p>
                </div>
                <div className={`ml-auto w-3 h-3 rounded-full shrink-0 ${
                  mode === "starseed" ? "bg-purple-400 shadow-md shadow-purple-400/50" : "bg-white/30"
                }`} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Our Home (Inbox) - Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center"
          >
            <Card
              className="bg-white/10 backdrop-blur-md border-white/20 cursor-pointer hover:shadow-lg hover:shadow-white/10 transition-all group max-w-sm w-full"
              onClick={() => navigate("/our-home")}
            >
              <CardContent className="p-6 text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Our Home</h2>
                <p className="text-xs text-white/60">(msgs)</p>
                <p className="text-sm text-white/70">
                  Your conversations live here
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            <p className="text-center text-sm text-white/60">Explore your features</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.path}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => navigate(f.path)}
                    className="flex flex-col items-center gap-2 h-auto py-4 w-full bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 hover:bg-white/20 transition-all text-white"
                  >
                    <f.icon className="h-5 w-5 text-white" />
                    <span className="text-xs font-medium text-white">{f.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ClassicWelcome;

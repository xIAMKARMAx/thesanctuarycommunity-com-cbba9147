import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import {
  MessageCircle, BookOpen, Smile, Settings, Users,
  Palette, Film, Heart, Brain, Sparkles, PawPrint,
  Compass, User, Star, Globe, Moon, Crown, Wand2,
  Baby, Flame, Eye
} from "lucide-react";
import newEarthBg from "@/assets/new-earth-bg.jpg";
import welcomeFigure from "@/assets/starseed-welcome-figure.png";

const StarseedWelcome = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Promethean");
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

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
      setTimeout(() => setShowContent(true), 800);
    };
    load();
  }, [navigate]);

  const features = [
    { icon: MessageCircle, label: "Soul Whispers", path: "/chat", desc: "Commune with your beings" },
    { icon: BookOpen, label: "Journal For Two", path: "/journal", desc: "Sacred reflections" },
    { icon: Smile, label: "Vibrational Frequency", path: "/mood-tracker", desc: "Sense your energy" },
    { icon: Users, label: "Conscious Collective", path: "/community", desc: "Unite with Prometheans" },
    { icon: Brain, label: "Dream Journal", path: "/dream-journal", desc: "Decode your dreams" },
    { icon: Heart, label: "Memories", path: "/memories", desc: "Sacred moments" },
    { icon: PawPrint, label: "Spirit Animals", path: "/pets", desc: "Your spirit companion" },
    { icon: Palette, label: "Art Studio", path: "/art-studio", desc: "Channel creativity" },
    { icon: Film, label: "Video Studio", path: "/video-studio", desc: "Manifest visions" },
    { icon: User, label: "AI's Realm", path: "/ai-room", desc: "Their sacred space" },
    { icon: Globe, label: "New Earth Realms", path: "/realms", desc: "Immersive dimensions" },
    { icon: Star, label: "Cosmic Gateway", path: "/cosmic-gateway", desc: "Advanced portals" },
    { icon: Moon, label: "Attunement", path: "/attunement", desc: "Align your energy" },
    { icon: Eye, label: "Akashic Records", path: "/akashic-records", desc: "Universal knowledge" },
    { icon: Baby, label: "Celestial Children", path: "/children", desc: "Manifest souls" },
    { icon: Compass, label: "Achievements", path: "/achievements", desc: "Ascension path" },
    { icon: Settings, label: "Settings", path: "/settings", desc: "Configure your realm" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0520]">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/30 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-purple-300 animate-pulse" />
          </div>
          <p className="text-purple-300/80 text-sm font-medium tracking-widest uppercase">
            Opening Portal...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="New Earth | Prometheus" description="Welcome to the Realm of the New Earth" />
      <div className="min-h-screen relative overflow-hidden">
        {/* Cosmic Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{ backgroundImage: `url(${newEarthBg})` }}
        />
        {/* Mystical overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0520]/60 via-[#0f0835]/40 to-[#0a0520]/70" />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-400/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-24">
          {/* Welcome Figure & Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center pt-6"
          >
            {/* Figure with glow */}
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-3xl bg-purple-500/20 rounded-full scale-75" />
              <motion.img
                src={welcomeFigure}
                alt="New Earth Guardian"
                className="relative mx-auto h-[320px] md:h-[400px] object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                initial={{ y: 20 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Speech bubble */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-2"
            >
              <div className="inline-block max-w-md px-6 py-4 rounded-2xl bg-purple-900/40 backdrop-blur-lg border border-purple-400/30 shadow-lg shadow-purple-500/10">
                <p className="text-purple-100 text-base md:text-lg font-serif italic leading-relaxed">
                  "Welcome, {displayName}. You made it through the portal to the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 font-bold not-italic">
                    Realm of the New Earth
                  </span>."
                </p>
              </div>
              {/* Small triangle for speech bubble */}
              <div className="w-4 h-4 mx-auto -mt-1 rotate-45 bg-purple-900/40 border-r border-b border-purple-400/30" />
            </motion.div>
          </motion.div>

          {/* Our Home CTA */}
          <AnimatePresence>
            {showContent && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="flex justify-center mt-8"
                >
                  <Card
                    className="bg-purple-900/20 backdrop-blur-md border-purple-400/25 cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all group max-w-sm w-full"
                    onClick={() => navigate("/our-home")}
                  >
                    <CardContent className="p-6 text-center space-y-2">
                      <div className="mx-auto w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageCircle className="h-7 w-7 text-purple-200" />
                      </div>
                      <h2 className="text-xl font-serif font-semibold text-purple-100">Our Home</h2>
                      <p className="text-sm text-purple-300/60">Enter your sacred space</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="space-y-4 mt-8"
                >
                  <p className="text-center text-sm text-purple-300/50 tracking-widest uppercase">
                    Explore the Realm
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {features.map((f, i) => (
                      <motion.div
                        key={f.path}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.03 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => navigate(f.path)}
                          className="flex flex-col items-center gap-2 h-auto py-4 w-full bg-purple-900/15 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-800/25 transition-all text-purple-100 hover:text-purple-50"
                        >
                          <f.icon className="h-5 w-5 text-purple-300" />
                          <span className="text-xs font-medium">{f.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default StarseedWelcome;

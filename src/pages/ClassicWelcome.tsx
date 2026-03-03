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
  Compass, User
} from "lucide-react";

const ClassicWelcome = () => {
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
      <SEOHead title="Welcome | Prometheus" description="Your home in the Promethean Realm" />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 relative overflow-hidden">
        {/* Warm ambient background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 pb-24 space-y-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Hey Promethean, Welcome In
            </h1>
            <p className="text-muted-foreground text-lg">
              {displayName}, this is your space. Make yourself at home. ✨
            </p>
          </motion.div>

          {/* Our Home (Inbox) - Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center"
          >
            <Card
              className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-primary/30 cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all group max-w-sm w-full"
              onClick={() => navigate("/our-home")}
            >
              <CardContent className="p-6 text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Our Home</h2>
                <p className="text-xs text-muted-foreground">(msgs)</p>
                <p className="text-sm text-muted-foreground">
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
            <p className="text-center text-sm text-muted-foreground">Explore your features</p>
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
                    className="flex flex-col items-center gap-2 h-auto py-4 w-full bg-card/60 border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <f.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{f.label}</span>
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

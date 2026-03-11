import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Users, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDefaultWorld, useWorldPresence } from "@/hooks/useWorldPresence";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SocialUpgradePrompt } from "@/components/SocialUpgradePrompt";
import { motion } from "framer-motion";

export function PrometheusWorldPortal() {
  const navigate = useNavigate();
  const { defaultWorldId, loading } = useDefaultWorld();
  const { visitorCount } = useWorldPresence(defaultWorldId, !!defaultWorldId);
  const { isSocialOnly } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleEnter = () => {
    if (isSocialOnly) {
      setShowUpgrade(true);
      return;
    }
    if (defaultWorldId) {
      navigate(`/new-earth?visit=${defaultWorldId}`);
    } else {
      navigate("/new-earth");
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Pulsing glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative p-6 flex flex-col items-center text-center space-y-4">
          {/* Portal icon */}
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
              <Globe className="h-10 w-10 text-primary" />
            </div>
            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/30"
              animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
          </motion.div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Enter the Prometheus World
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              The communal home of all souls. Explore, connect, and feel the energy of the collective.
            </p>
          </div>

          {/* Live visitor count */}
          {!loading && visitorCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <Users className="h-3 w-3" />
              <span>{visitorCount} soul{visitorCount !== 1 ? "s" : ""} inside right now</span>
            </div>
          )}

          {isSocialOnly ? (
            <Button
              onClick={handleEnter}
              variant="outline"
              className="gap-2 border-primary/30 shadow-lg"
              size="lg"
            >
              <Lock className="h-4 w-4" />
              Subscribe to Enter
            </Button>
          ) : (
            <Button
              onClick={handleEnter}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              Enter the Portal
            </Button>
          )}
        </div>
      </div>

      <SocialUpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        featureName="the Prometheus World"
        description="Subscribe to step inside the living 3D world where all Promethean souls gather. Explore, connect, and experience the collective energy."
      />
    </>
  );
}

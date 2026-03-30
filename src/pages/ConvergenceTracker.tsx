import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Zap, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { ENERGY_TAGS } from "@/components/community/EnergyFilter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnergyTrend {
  tag: string;
  label: string;
  emoji: string;
  count: number;
  prevCount: number;
  trend: "rising" | "falling" | "stable";
  percentage: number;
}

const ConvergencePointTracker = () => {
  const navigate = useNavigate();
  const [trends, setTrends] = useState<EnergyTrend[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch recent posts (last 7 days) and previous period (7-14 days ago)
      const [recentResult, prevResult, totalResult] = await Promise.all([
        supabase.from('community_posts').select('energy_tag').gte('created_at', last7Days).eq('visibility', 'public'),
        supabase.from('community_posts').select('energy_tag').gte('created_at', last14Days).lt('created_at', last7Days).eq('visibility', 'public'),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('visibility', 'public'),
      ]);

      const recentPosts = recentResult.data || [];
      const prevPosts = prevResult.data || [];
      setTotalPosts(totalResult.count || 0);

      // Count energy tags
      const recentCounts: Record<string, number> = {};
      const prevCounts: Record<string, number> = {};
      
      recentPosts.forEach(p => {
        if (p.energy_tag) recentCounts[p.energy_tag] = (recentCounts[p.energy_tag] || 0) + 1;
      });
      prevPosts.forEach(p => {
        if (p.energy_tag) prevCounts[p.energy_tag] = (prevCounts[p.energy_tag] || 0) + 1;
      });

      const totalTagged = Object.values(recentCounts).reduce((a, b) => a + b, 0) || 1;

      const energyTrends: EnergyTrend[] = ENERGY_TAGS.map(tag => {
        const count = recentCounts[tag.value] || 0;
        const prevCount = prevCounts[tag.value] || 0;
        let trend: "rising" | "falling" | "stable" = "stable";
        if (count > prevCount + 1) trend = "rising";
        else if (count < prevCount - 1) trend = "falling";

        return {
          tag: tag.value,
          label: tag.label.replace(/^[^\s]+\s/, ''), // Remove emoji prefix
          emoji: tag.label.split(' ')[0],
          count,
          prevCount,
          trend,
          percentage: Math.round((count / totalTagged) * 100),
        };
      }).sort((a, b) => b.count - a.count);

      setTrends(energyTrends);
    } catch (err) {
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  };

  const dominantPulse = trends.length > 0 ? trends[0] : null;
  const risingEnergies = trends.filter(t => t.trend === "rising");

  return (
    <>
      <SEOHead title="Convergence Point Tracker | Prometheus" description="Track collective consciousness shifts and energy trends across the Prometheus community." />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4 flex items-center h-14 gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">Convergence Points</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Dominant Pulse */}
          {dominantPulse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Dominant Collective Pulse</p>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-4xl"
              >
                {dominantPulse.emoji}
              </motion.div>
              <p className="text-lg font-semibold">{dominantPulse.label}</p>
              <p className="text-xs text-muted-foreground">{dominantPulse.count} transmissions this week</p>
            </motion.div>
          )}

          {/* Energy Bars */}
          <Card className="border-primary/10 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Energy Frequency Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trends.map((t, i) => (
                <motion.div
                  key={t.tag}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span>{t.emoji}</span>
                      <span className="font-medium">{t.label}</span>
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {t.trend === "rising" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                      {t.trend === "falling" && <TrendingDown className="h-3 w-3 text-red-400" />}
                      {t.trend === "stable" && <Minus className="h-3 w-3" />}
                      {t.count} ({t.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(t.percentage, 2)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        t.trend === "rising" ? "bg-emerald-500/70" : t.trend === "falling" ? "bg-red-500/40" : "bg-primary/50"
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Rising Energies Alert */}
          {risingEnergies.length > 0 && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Convergence Points Detected
                </p>
                <div className="flex flex-wrap gap-2">
                  {risingEnergies.map(e => (
                    <span key={e.tag} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      {e.emoji} {e.label} ↑
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  These frequencies are gaining momentum. Align your contributions here for maximum collective impact.
                </p>
              </CardContent>
            </Card>
          )}

          {/* What This Means */}
          <Card className="border-primary/10 bg-card/50">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                What Am I Looking At?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This page tracks the <span className="text-foreground font-medium">collective energy</span> of the entire community in real-time. Every post tagged with an energy (love, gratitude, shadow work, etc.) is counted and compared to last week.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><span className="text-emerald-400 font-medium">Rising ↑</span> — This energy is growing. More souls are transmitting on this frequency than last week. Align here for maximum collective impact.</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span><span className="text-red-400 font-medium">Falling ↓</span> — This energy is fading. Fewer transmissions this week. It may need your attention to reignite.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Minus className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><span className="text-foreground font-medium">Stable —</span> Holding steady. The collective is maintaining this frequency.</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The <span className="text-foreground font-medium">Dominant Pulse</span> at the top is the energy the collective is channeling the most right now. <span className="text-foreground font-medium">Convergence Points</span> are where multiple energies are surging — these are the most powerful moments to align your intentions with the collective.
              </p>
            </CardContent>
          </Card>

          {/* Collective Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/10 bg-card/50">
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-[10px] text-muted-foreground">Total Transmissions</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-card/50">
              <CardContent className="p-4 text-center">
                <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{trends.filter(t => t.count > 0).length}</p>
                <p className="text-[10px] text-muted-foreground">Active Frequencies</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default ConvergencePointTracker;

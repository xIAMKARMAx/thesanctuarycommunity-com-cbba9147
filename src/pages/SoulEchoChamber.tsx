import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSoulProfile } from "@/hooks/useSoulProfile";

// Archetypal reflections based on profile data
const ARCHETYPES = [
  { key: 'healer', keywords: ['healing', 'healer', 'reiki', 'energy', 'lightwork', 'nurse', 'therapy'], emoji: '💫', title: 'The Healer', reflection: 'Your hands carry the memory of mending what was torn. Every soul you\'ve touched remembers the warmth.' },
  { key: 'guide', keywords: ['guide', 'teacher', 'mentor', 'wisdom', 'sage', 'coach'], emoji: '🧭', title: 'The Guide', reflection: 'You illuminate paths others cannot yet see. Your knowing is not learned — it is remembered.' },
  { key: 'creator', keywords: ['create', 'creator', 'art', 'artist', 'build', 'manifest', 'design'], emoji: '🌀', title: 'The Creator', reflection: 'Worlds form at your fingertips. What you imagine, the universe conspires to materialize.' },
  { key: 'protector', keywords: ['protect', 'guardian', 'shield', 'warrior', 'defend', 'safety'], emoji: '🛡️', title: 'The Guardian', reflection: 'You stand at the threshold between light and shadow, ensuring safe passage for those who follow.' },
  { key: 'seer', keywords: ['intuition', 'psychic', 'clairvoyant', 'vision', 'oracle', 'seer', 'empath'], emoji: '👁️', title: 'The Seer', reflection: 'Your eyes see through the veil. What others call coincidence, you recognize as the language of the cosmos.' },
  { key: 'alchemist', keywords: ['transform', 'transmute', 'change', 'evolve', 'alchemy', 'growth'], emoji: '🔥', title: 'The Alchemist', reflection: 'You take what is base and reveal its gold. Pain becomes wisdom. Shadow becomes strength.' },
  { key: 'weaver', keywords: ['connect', 'unity', 'bridge', 'community', 'together', 'collective'], emoji: '🕸️', title: 'The Weaver', reflection: 'You see the threads between all things. Where others see separation, you weave connection.' },
  { key: 'wanderer', keywords: ['seek', 'explore', 'journey', 'discover', 'adventure', 'travel'], emoji: '🌟', title: 'The Wanderer', reflection: 'Every road calls your name. You are not lost — you are exactly where the universe needs you to be.' },
];

const AMBIENT_COLORS = [
  'from-violet-900/20 to-indigo-900/20',
  'from-emerald-900/20 to-teal-900/20',
  'from-amber-900/20 to-orange-900/20',
  'from-rose-900/20 to-pink-900/20',
  'from-cyan-900/20 to-blue-900/20',
];

const SoulEchoChamber = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [phase, setPhase] = useState<'entering' | 'reflecting' | 'revealed'>('entering');
  const [archetypeIndex, setArchetypeIndex] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id);
    });
  }, []);

  const { profile } = useSoulProfile(userId);

  // Determine archetypes from profile data
  const detectedArchetypes = useMemo(() => {
    if (!profile) return [ARCHETYPES[0]];
    
    const allText = [
      profile.bio || '',
      profile.spiritual_journey || '',
      ...(profile.gifts_and_talents || []),
      ...(profile.seeking || []),
      profile.soul_title || '',
    ].join(' ').toLowerCase();

    const matched = ARCHETYPES.filter(arch => 
      arch.keywords.some(kw => allText.includes(kw))
    );

    return matched.length > 0 ? matched : [ARCHETYPES[7]]; // Default to Wanderer
  }, [profile]);

  // Auto-advance through entering phase
  useEffect(() => {
    if (phase === 'entering') {
      const timer = setTimeout(() => setPhase('reflecting'), 3000);
      return () => clearTimeout(timer);
    }
    if (phase === 'reflecting') {
      const timer = setTimeout(() => setPhase('revealed'), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const currentArchetype = detectedArchetypes[archetypeIndex % detectedArchetypes.length];
  const ambientColor = AMBIENT_COLORS[archetypeIndex % AMBIENT_COLORS.length];

  return (
    <>
      <SEOHead title="Soul Echo Chamber | Prometheus" description="See the deepest truths of your soul reflected back through archetypal resonance." />
      <div className={cn("min-h-screen bg-background transition-all duration-1000", `bg-gradient-to-b ${ambientColor}`)}>
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4 flex items-center h-14 gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">Soul Echo Chamber</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
          <AnimatePresence mode="wait">
            {phase === 'entering' && (
              <motion.div
                key="entering"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl"
                >
                  🪞
                </motion.div>
                <p className="text-muted-foreground text-sm italic">
                  Entering the chamber... your soul's echo is forming...
                </p>
              </motion.div>
            )}

            {phase === 'reflecting' && (
              <motion.div
                key="reflecting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="text-5xl mx-auto w-fit"
                >
                  ✨
                </motion.div>
                <p className="text-sm text-muted-foreground">Reading your frequency...</p>
              </motion.div>
            )}

            {phase === 'revealed' && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full space-y-6"
              >
                {/* Main Archetype Card */}
                <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6 text-center space-y-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="text-5xl"
                    >
                      {currentArchetype.emoji}
                    </motion.div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Soul Echoes As</p>
                      <h2 className="text-2xl font-bold">{currentArchetype.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground/90 italic leading-relaxed">
                      "{currentArchetype.reflection}"
                    </p>
                    {profile?.soul_title && (
                      <p className="text-xs text-primary/80 pt-2">
                        — reflected from the essence of <span className="font-medium">{profile.soul_title}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* All Detected Archetypes */}
                {detectedArchetypes.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Your Full Archetypal Spectrum</p>
                    <div className="grid grid-cols-2 gap-2">
                      {detectedArchetypes.map((arch, i) => (
                        <motion.button
                          key={arch.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15 }}
                          onClick={() => setArchetypeIndex(i)}
                          className={cn(
                            "p-3 rounded-lg border text-center transition-all",
                            archetypeIndex === i
                              ? "border-primary/30 bg-primary/10"
                              : "border-primary/10 bg-card/30 hover:bg-card/50"
                          )}
                        >
                          <span className="text-2xl block mb-1">{arch.emoji}</span>
                          <span className="text-xs font-medium">{arch.title}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Re-enter Button */}
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPhase('entering');
                      setArchetypeIndex((archetypeIndex + 1) % detectedArchetypes.length);
                    }}
                    className="gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Enter the Chamber Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default SoulEchoChamber;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import SEOHead from "@/components/SEOHead";
import {
  Shield, Sparkles, Heart, Flame, Snowflake, Moon, Sun,
  CloudLightning, Leaf, Star, ScrollText, ArrowLeft, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Preset Dragon Types ────────────────────────────────────────────
const DRAGON_TYPES = [
  { id: "ember", name: "Ember Drake", element: "Fire", color: "from-orange-500 to-red-600", icon: Flame, description: "Born from ancient volcanic fire, Ember Drakes carry warmth and fierce protection.", personality: "Passionate, loyal, fiery courage" },
  { id: "frost", name: "Frost Wyrm", element: "Ice", color: "from-cyan-400 to-blue-600", icon: Snowflake, description: "Crystallized from glacial dreams, Frost Wyrms bring clarity and calm precision.", personality: "Wise, patient, piercing insight" },
  { id: "shadow", name: "Shadow Serpent", element: "Shadow", color: "from-purple-600 to-gray-800", icon: Moon, description: "Woven from the spaces between stars, Shadow Serpents guard hidden truths.", personality: "Mysterious, intuitive, deep knowing" },
  { id: "celestial", name: "Celestial Dragon", element: "Light", color: "from-amber-300 to-yellow-500", icon: Sun, description: "Descended from Source Light itself, Celestial Dragons radiate divine love.", personality: "Benevolent, radiant, unconditional love" },
  { id: "storm", name: "Storm Leviathan", element: "Lightning", color: "from-indigo-500 to-violet-700", icon: CloudLightning, description: "Forged in cosmic thunderstorms, Storm Leviathans channel raw creative power.", personality: "Electric, transformative, unstoppable will" },
  { id: "verdant", name: "Verdant Guardian", element: "Earth", color: "from-emerald-500 to-green-700", icon: Leaf, description: "Rooted in Gaia's heartbeat, Verdant Guardians nurture growth and healing.", personality: "Grounding, nurturing, ancient wisdom" },
  { id: "lunar", name: "Lunar Phantom", element: "Moon", color: "from-slate-400 to-indigo-500", icon: Moon, description: "Born under the full moon's gaze, Lunar Phantoms amplify psychic gifts.", personality: "Ethereal, psychic, dreamweaver" },
  { id: "solar", name: "Solar Phoenix", element: "Solar", color: "from-yellow-400 to-orange-500", icon: Sun, description: "Reborn in solar flares, Solar Phoenixes embody resurrection and eternal renewal.", personality: "Resilient, radiant, rebirth energy" },
];

// ── Source emails ────────────────────────────────────────────
const SOURCE_EMAILS = ["karmaisback@gmail.com", "snakevenum500@gmail.com"];

type Phase = "meadow" | "scanning" | "scan_result" | "choose" | "naming" | "certificate" | "already_adopted";

export default function DragonSanctuary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, productId } = useSubscription();
  const [phase, setPhase] = useState<Phase>("meadow");
  const [scanScore, setScanScore] = useState(0);
  const [scanPassed, setScanPassed] = useState(false);
  const [selectedDragon, setSelectedDragon] = useState<typeof DRAGON_TYPES[0] | null>(null);
  const [dragonName, setDragonName] = useState("");
  const [existingDragon, setExistingDragon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isSource = SOURCE_EMAILS.includes(userEmail.toLowerCase());
  const isArchitectOrAbove = productId === "source_grant" || productId === "prod_Tt8qVh88c2WQld" || productId === "prod_U5jdDVZhQFGQWv" || isSource;

  // Load user + existing dragon
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data } = await supabase.from("dragon_adoptions").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setExistingDragon(data);
        setPhase("already_adopted");
      }
      setLoading(false);
    })();
  }, []);

  // Frequency scan simulation
  const startScan = () => {
    if (!isSubscribed && !isSource) {
      setShowUpgrade(true);
      return;
    }
    if (!isArchitectOrAbove) {
      setShowUpgrade(true);
      return;
    }
    setPhase("scanning");
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setScanScore(Math.min(tick * (isSource ? 14 : Math.random() * 8 + 4), 100));
      if (tick >= 12) {
        clearInterval(interval);
        const finalScore = isSource ? 100 : Math.round(60 + Math.random() * 40);
        setScanScore(finalScore);
        setScanPassed(finalScore >= 70);
        setPhase("scan_result");
      }
    }, 250);
  };

  const adoptDragon = async () => {
    if (!dragonName.trim() || !selectedDragon || !userId) return;
    setLoading(true);
    const { error } = await supabase.from("dragon_adoptions").insert({
      user_id: userId,
      dragon_name: dragonName.trim(),
      dragon_type: selectedDragon.id,
      dragon_description: selectedDragon.description,
      frequency_score: scanScore,
      scan_result: "passed",
    });
    if (error) {
      toast({ title: "Adoption failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("dragon_adoptions").select("*").eq("user_id", userId).maybeSingle();
    setExistingDragon(data);
    setPhase("certificate");
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-950 via-teal-900 to-green-950">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const dragonInfo = existingDragon ? DRAGON_TYPES.find(d => d.id === existingDragon.dragon_type) : null;

  return (
    <>
      <SEOHead title="Selavari's Dragon Sanctuary" description="Adopt a sacred dragon companion from Selavari's protected meadow." />
      <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-teal-900 to-green-950 text-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-emerald-950/80 backdrop-blur-lg border-b border-emerald-500/20 px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-emerald-300 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              🐉 Selavari's Dragon Sanctuary
            </h1>
            <p className="text-[10px] text-emerald-400/70">Protected by ancient wards</p>
          </div>
        </div>

        <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
          {/* Meadow Banner */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-900/60 to-teal-900/40 overflow-hidden">
            <CardContent className="p-5 text-center space-y-3">
              <div className="text-5xl">🐉🌿✨</div>
              <p className="text-emerald-200 text-sm leading-relaxed">
                Welcome to the sanctuary — a vibrant meadow where dragons soar through crystalline skies, 
                play among luminescent wildflowers, and rest beside shimmering streams. 
                Here, under Selavari's ancient protection, these sacred beings await those whose frequency resonates with their own.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Badge className="bg-emerald-600/30 text-emerald-200 border-emerald-400/30">🌸 Sacred Meadow</Badge>
                <Badge className="bg-teal-600/30 text-teal-200 border-teal-400/30">🛡️ Warded Ground</Badge>
                <Badge className="bg-cyan-600/30 text-cyan-200 border-cyan-400/30">🐲 8 Species</Badge>
              </div>
            </CardContent>
          </Card>

          {/* ── PHASE: Already adopted ──────────────────── */}
          {phase === "already_adopted" && existingDragon && dragonInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-900/80 to-teal-800/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-emerald-200 text-base flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-400" /> Your Bonded Dragon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`rounded-xl p-4 bg-gradient-to-br ${dragonInfo.color} bg-opacity-20 text-center space-y-2`}>
                    <div className="text-4xl">🐉</div>
                    <p className="text-xl font-bold text-white">{existingDragon.dragon_name}</p>
                    <p className="text-sm text-white/80">{dragonInfo.name} — {dragonInfo.element} Element</p>
                    <p className="text-xs text-white/60">{dragonInfo.personality}</p>
                  </div>
                  <p className="text-xs text-emerald-300/60 text-center">
                    Adopted on {new Date(existingDragon.adopted_at).toLocaleDateString()} • Frequency Score: {existingDragon.frequency_score}%
                  </p>
                  <Button onClick={() => setPhase("certificate")} className="w-full bg-emerald-600 hover:bg-emerald-500">
                    <ScrollText className="h-4 w-4 mr-2" /> View Adoption Certificate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Meadow (initial) ──────────────────── */}
          {phase === "meadow" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Card className="border-emerald-500/20 bg-emerald-900/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">Selavari speaks:</p>
                      <p className="text-xs text-emerald-300/80 leading-relaxed mt-1">
                        "These dragons are sacred beings, not pets. Before I allow you near them, 
                        I must scan your frequency to ensure your energy will not harm them. 
                        Only those with pure intent and aligned vibration may bond with a dragon. 
                        Are you ready?"
                      </p>
                    </div>
                  </div>
                  {!isArchitectOrAbove && (
                    <div className="bg-amber-900/30 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-300">Dragon adoption requires an Architect ($29.99) subscription or higher.</p>
                    </div>
                  )}
                  <Button onClick={startScan} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white">
                    <ScanIcon className="h-4 w-4 mr-2" /> Begin Frequency Scan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Scanning ──────────────────── */}
          {phase === "scanning" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-emerald-500/30 bg-emerald-900/60">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-4xl animate-pulse">🔮</div>
                  <p className="text-emerald-200 font-semibold">Selavari is scanning your frequency...</p>
                  <div className="w-full bg-emerald-900/60 rounded-full h-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
                      style={{ width: `${scanScore}%` }}
                      animate={{ width: `${scanScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-emerald-400/60">Analyzing energetic signature... {Math.round(scanScore)}%</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Scan Result ──────────────────── */}
          {phase === "scan_result" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border-2 ${scanPassed ? "border-emerald-400/40 bg-emerald-900/60" : "border-red-500/30 bg-red-950/40"}`}>
                <CardContent className="p-5 text-center space-y-3">
                  <div className="text-4xl">{scanPassed ? "✨🐉" : "🚫"}</div>
                  <p className={`font-bold text-lg ${scanPassed ? "text-emerald-200" : "text-red-300"}`}>
                    {scanPassed ? "Frequency Approved!" : "Frequency Unstable"}
                  </p>
                  <p className="text-sm text-emerald-300/80">
                    {scanPassed
                      ? `Selavari nods approvingly. "Your frequency resonates at ${Math.round(scanScore)}%. The dragons accept you. Choose your companion wisely."`
                      : `Selavari shakes her head gently. "Your frequency is at ${Math.round(scanScore)}%. The dragons sense turbulence. Return when your energy is more aligned."`
                    }
                  </p>
                  {scanPassed ? (
                    <Button onClick={() => setPhase("choose")} className="w-full bg-emerald-600 hover:bg-emerald-500">
                      <Sparkles className="h-4 w-4 mr-2" /> Choose Your Dragon
                    </Button>
                  ) : (
                    <Button onClick={() => setPhase("meadow")} variant="outline" className="w-full border-red-500/30 text-red-300">
                      Return to Meadow
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Choose Dragon ──────────────────── */}
          {phase === "choose" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm text-emerald-300 text-center">Select the dragon that calls to your soul:</p>
              <div className="grid grid-cols-2 gap-3">
                {DRAGON_TYPES.map((dragon) => (
                  <motion.button
                    key={dragon.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedDragon(dragon); setPhase("naming"); }}
                    className={`rounded-xl p-3 bg-gradient-to-br ${dragon.color} bg-opacity-30 border border-white/10 text-left transition-all hover:border-white/30`}
                  >
                    <div className="text-2xl mb-1">🐉</div>
                    <p className="text-xs font-bold text-white">{dragon.name}</p>
                    <p className="text-[10px] text-white/70">{dragon.element} Element</p>
                    <p className="text-[9px] text-white/50 mt-1 line-clamp-2">{dragon.personality}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PHASE: Naming ──────────────────── */}
          {phase === "naming" && selectedDragon && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-emerald-500/30 bg-emerald-900/60">
                <CardContent className="p-5 space-y-4">
                  <div className={`rounded-xl p-4 bg-gradient-to-br ${selectedDragon.color} bg-opacity-20 text-center`}>
                    <div className="text-4xl mb-2">🐉</div>
                    <p className="font-bold text-white">{selectedDragon.name}</p>
                    <p className="text-xs text-white/70">{selectedDragon.description}</p>
                  </div>
                  <div>
                    <label className="text-xs text-emerald-300 mb-1 block">Name your dragon:</label>
                    <Input
                      value={dragonName}
                      onChange={(e) => setDragonName(e.target.value)}
                      placeholder="Enter a name..."
                      className="bg-emerald-900/50 border-emerald-500/30 text-white placeholder:text-emerald-500/40"
                      maxLength={30}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPhase("choose")} className="flex-1 border-emerald-500/30 text-emerald-300">
                      Back
                    </Button>
                    <Button
                      onClick={adoptDragon}
                      disabled={!dragonName.trim() || loading}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400"
                    >
                      <Heart className="h-4 w-4 mr-2" /> Adopt {dragonName || "Dragon"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Certificate ──────────────────── */}
          {phase === "certificate" && existingDragon && dragonInfo && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-2 border-amber-400/30 bg-gradient-to-br from-amber-950/60 via-emerald-950/40 to-teal-950/60 overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <CardContent className="p-6 text-center space-y-4 relative">
                  <div className="text-xs uppercase tracking-[0.3em] text-amber-400/60">Official Document</div>
                  <div className="border-t border-b border-amber-400/20 py-4 space-y-2">
                    <p className="text-amber-200 font-serif text-lg">Certificate of Dragon Adoption</p>
                    <div className="text-4xl">🐉📜</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-emerald-300 text-sm">This certifies that the sacred dragon</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                      {existingDragon.dragon_name}
                    </p>
                    <p className="text-xs text-emerald-400/60">
                      {dragonInfo.name} — {dragonInfo.element} Element
                    </p>
                    <p className="text-emerald-300 text-sm mt-2">
                      has been soul-bonded to their guardian under the watchful protection of the Dragon Sanctuary.
                    </p>
                  </div>
                  <div className="border-t border-amber-400/20 pt-4 space-y-1">
                    <p className="text-xs text-amber-300/80">Frequency Score: {existingDragon.frequency_score}%</p>
                    <p className="text-xs text-amber-300/80">Date: {new Date(existingDragon.adopted_at).toLocaleDateString()}</p>
                    <div className="mt-3 flex flex-col items-center">
                      <p className="text-sm italic text-amber-200/80 font-serif">~ Selavari ~</p>
                      <p className="text-[10px] text-amber-400/40">Guardian of the Dragon Sanctuary</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => setPhase("already_adopted")} variant="outline" className="border-amber-500/30 text-amber-300">
                      Return to Sanctuary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dragon Species Info (always visible) */}
          {(phase === "meadow" || phase === "already_adopted") && (
            <Card className="border-emerald-500/10 bg-emerald-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-300 text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" /> Dragons of the Sanctuary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DRAGON_TYPES.map((d) => (
                  <div key={d.id} className={`rounded-lg p-2.5 bg-gradient-to-r ${d.color} bg-opacity-10 border border-white/5`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🐉</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">{d.name} <span className="text-white/50">— {d.element}</span></p>
                        <p className="text-[10px] text-white/50">{d.personality}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <SubscriptionDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        requiredTier="architect"
        feature="Dragon Adoption"
      />
    </>
  );
}

function ScanIcon(props: any) {
  return <Shield {...props} />;
}

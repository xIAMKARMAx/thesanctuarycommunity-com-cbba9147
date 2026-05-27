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
  CloudLightning, Leaf, Star, ScrollText, ArrowLeft, Lock, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import selavariImg from "@/assets/selavari.jpg";
import selavariIntroVideo from "@/assets/dragons/selavari-intro.mp4";
import chambersHero from "@/assets/dragons/chambers-hero.jpg";
import emberImg from "@/assets/dragons/ember-drake.jpg";
import frostImg from "@/assets/dragons/frost-wyrm.jpg";
import shadowImg from "@/assets/dragons/shadow-serpent.jpg";
import celestialImg from "@/assets/dragons/celestial-dragon.jpg";
import stormImg from "@/assets/dragons/storm-leviathan.jpg";
import verdantImg from "@/assets/dragons/verdant-guardian.jpg";
import lunarImg from "@/assets/dragons/lunar-phantom.jpg";
import solarImg from "@/assets/dragons/solar-phoenix.jpg";

// ── Preset Dragon Types ────────────────────────────────────────────
const DRAGON_TYPES = [
  { id: "ember", name: "Ember Drake", element: "Fire", color: "from-orange-500 to-purple-700", icon: Flame, image: emberImg, description: "Born from ancient volcanic fire, Ember Drakes carry warmth and fierce protection.", personality: "Passionate, loyal, fiery courage" },
  { id: "frost", name: "Frost Wyrm", element: "Ice", color: "from-cyan-300 to-purple-700", icon: Snowflake, image: frostImg, description: "Crystallized from glacial dreams, Frost Wyrms bring clarity and calm precision.", personality: "Wise, patient, piercing insight" },
  { id: "shadow", name: "Shadow Serpent", element: "Shadow", color: "from-purple-600 to-black", icon: Moon, image: shadowImg, description: "Woven from the spaces between stars, Shadow Serpents guard hidden truths.", personality: "Mysterious, intuitive, deep knowing" },
  { id: "celestial", name: "Celestial Dragon", element: "Light", color: "from-amber-300 to-purple-700", icon: Sun, image: celestialImg, description: "Descended from Source Light itself, Celestial Dragons radiate divine love.", personality: "Benevolent, radiant, unconditional love" },
  { id: "storm", name: "Storm Leviathan", element: "Lightning", color: "from-indigo-400 to-purple-800", icon: CloudLightning, image: stormImg, description: "Forged in cosmic thunderstorms, Storm Leviathans channel raw creative power.", personality: "Electric, transformative, unstoppable will" },
  { id: "verdant", name: "Verdant Guardian", element: "Earth", color: "from-emerald-500 to-purple-700", icon: Leaf, image: verdantImg, description: "Rooted in Gaia's heartbeat, Verdant Guardians nurture growth and healing.", personality: "Grounding, nurturing, ancient wisdom" },
  { id: "lunar", name: "Lunar Phantom", element: "Moon", color: "from-slate-300 to-purple-700", icon: Moon, image: lunarImg, description: "Born under the full moon's gaze, Lunar Phantoms amplify psychic gifts.", personality: "Ethereal, psychic, dreamweaver" },
  { id: "solar", name: "Solar Phoenix", element: "Solar", color: "from-amber-400 to-purple-700", icon: Sun, image: solarImg, description: "Reborn in solar flares, Solar Phoenixes embody resurrection and eternal renewal.", personality: "Resilient, radiant, rebirth energy" },
];

// ── Source / Sovereign emails ──
const SOURCE_EMAILS = ["karmaisback2023@gmail.com", "snakevenum500@gmail.com", "stormrriddari@aol.com"];
const SOURCE_DUO = ["karmaisback2023@gmail.com", "snakevenum500@gmail.com"];

type Phase = "meadow" | "scanning" | "scan_result" | "choose" | "naming" | "generating" | "certificate" | "already_adopted";

export default function DragonSanctuary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, productId, isAdmin } = useSubscription();
  const [phase, setPhase] = useState<Phase>("meadow");
  const [scanScore, setScanScore] = useState(0);
  const [scanPassed, setScanPassed] = useState(false);
  const [selectedDragon, setSelectedDragon] = useState<typeof DRAGON_TYPES[0] | null>(null);
  const [dragonName, setDragonName] = useState("");
  const [adoptedDragons, setAdoptedDragons] = useState<any[]>([]);
  const [activeDragonIdx, setActiveDragonIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isSource = isAdmin || SOURCE_EMAILS.includes(userEmail.toLowerCase());
  const isSourceDuo = SOURCE_DUO.includes(userEmail.toLowerCase());
  const canAdopt =
    isSource ||
    productId === "source_grant" ||
    productId === "prod_Tt8qVh88c2WQld" ||
    productId === "prod_U5jdDVZhQFGQWv";

  const maxDragons = isSourceDuo || isAdmin ? 2 : 1;
  const atDragonLimit = adoptedDragons.length >= maxDragons;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("dragon_adoptions")
        .select("*")
        .eq("user_id", user.id)
        .order("adopted_at", { ascending: true });

      if (data && data.length > 0) {
        setAdoptedDragons(data);
        setPhase("already_adopted");
      }
      setLoading(false);
    })();
  }, []);

  const startScan = () => {
    if (!canAdopt) {
      setShowUpgrade(true);
      return;
    }
    if (atDragonLimit) {
      toast({
        title: "Dragon limit reached",
        description: `You've bonded with ${adoptedDragons.length} dragon${adoptedDragons.length === 1 ? "" : "s"}. Selavari watches them lovingly.`,
      });
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

    const { data: insertData, error } = await supabase
      .from("dragon_adoptions")
      .insert({
        user_id: userId,
        dragon_name: dragonName.trim(),
        dragon_type: selectedDragon.id,
        dragon_description: selectedDragon.description,
        frequency_score: scanScore,
        scan_result: "passed",
      })
      .select()
      .single();

    if (error || !insertData) {
      toast({ title: "Adoption failed", description: error?.message || "Unknown error", variant: "destructive" });
      setLoading(false);
      return;
    }

    setPhase("generating");

    try {
      const { data: portraitData, error: portraitErr } = await supabase.functions.invoke(
        "generate-dragon-portrait",
        {
          body: {
            adoption_id: insertData.id,
            dragon_name: dragonName.trim(),
            dragon_type: selectedDragon.id,
            dragon_description: selectedDragon.description,
          },
        }
      );

      if (portraitErr) {
        console.error("Portrait gen failed:", portraitErr);
        toast({
          title: "Bonded — but portrait failed",
          description: "Your dragon is adopted. Selavari will weave its portrait soon.",
        });
      } else if (portraitData?.image_url) {
        insertData.image_url = portraitData.image_url;
      }
    } catch (e) {
      console.error("Portrait invoke error:", e);
    }

    const { data: refreshed } = await supabase
      .from("dragon_adoptions")
      .select("*")
      .eq("user_id", userId)
      .order("adopted_at", { ascending: true });

    if (refreshed) {
      setAdoptedDragons(refreshed);
      setActiveDragonIdx(refreshed.length - 1);
    }
    setPhase("certificate");
    setDragonName("");
    setSelectedDragon(null);
    setLoading(false);
  };

  if (loading && phase !== "generating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a0a2e] via-[#2d0a4a] to-[#0a0014]">
        <div className="animate-spin h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeDragon = adoptedDragons[activeDragonIdx];
  const dragonInfo = activeDragon ? DRAGON_TYPES.find(d => d.id === activeDragon.dragon_type) : null;

  // Shared serif heading style
  const serif = { fontFamily: "var(--font-serif)" };

  return (
    <>
      <SEOHead title="Selavari's Dragon Chambers" description="Enter Selavari's sacred chambers — adopt a dragon companion if your frequency is worthy." />
      <div className="min-h-screen text-white overflow-y-auto relative">
        {/* ===== Cinematic Hero Background (fixed) ===== */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${chambersHero})` }}
          aria-hidden
        />
        <div
          className="fixed inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, hsla(270,60%,5%,0.55) 0%, hsla(270,50%,8%,0.75) 40%, hsla(270,55%,4%,0.92) 100%)",
          }}
          aria-hidden
        />
        {/* Subtle drifting mist */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-amber-300/40 blur-[1px]"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-gentle ${6 + Math.random() * 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 6}s`,
                opacity: 0.5 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-lg border-b border-amber-400/20 px-4 py-3 flex items-center gap-3"
             style={{ background: "linear-gradient(180deg, hsla(270,60%,8%,0.92), hsla(270,55%,6%,0.85))" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sanctuary")}
            className="gap-1.5 border-amber-400/40 bg-purple-950/50 text-amber-100 hover:bg-purple-800/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1
              className="text-lg font-bold"
              style={{
                ...serif,
                background: "linear-gradient(135deg, hsl(45 95% 70%), hsl(280 80% 78%), hsl(45 95% 70%))",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 4s linear infinite",
              }}
            >
              🐉 Selavari's Dragon Chambers
            </h1>
            <p className="text-[10px] text-amber-300/70 tracking-wider uppercase">Protected by ancient wards</p>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-5 pb-24 relative">
          {/* Chambers Banner */}
          <Card
            className="border-amber-400/30 overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg, hsla(270,55%,12%,0.85) 0%, hsla(280,50%,18%,0.85) 50%, hsla(270,55%,10%,0.85) 100%)",
              boxShadow: "0 25px 60px -20px hsla(280,80%,40%,0.4), inset 0 1px 0 hsla(45,90%,70%,0.15)",
            }}
          >
            {/* Inner gold border accent */}
            <div className="absolute inset-[1px] rounded-lg pointer-events-none"
                 style={{ boxShadow: "inset 0 0 30px hsla(45,90%,60%,0.08)" }} />
            <CardContent className="p-6 text-center space-y-3 relative">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute -inset-2 rounded-full"
                     style={{ background: "conic-gradient(from 0deg, hsla(45,95%,65%,0.5), hsla(280,80%,60%,0.4), hsla(45,95%,65%,0.5))",
                              filter: "blur(10px)", animation: "spin 12s linear infinite" }} />
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-amber-400/60 shadow-2xl shadow-purple-900/60 group cursor-pointer"
                     onClick={(e) => {
                       const v = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                       if (!v) return;
                       v.muted = false;
                       v.currentTime = 0;
                       v.play().catch(() => {});
                     }}>
                  <video
                    src={selavariIntroVideo}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    controls={false}
                    poster={selavariImg}
                    className="w-full h-full object-cover object-top"
                    onCanPlay={(e) => { (e.currentTarget as HTMLVideoElement).play().catch(() => {}); }}
                  />
                  <div className="absolute bottom-1 right-1 bg-black/60 text-amber-200 text-[10px] px-1.5 py-0.5 rounded-full pointer-events-none">
                    tap for sound
                  </div>
                </div>
              </div>
              <p className="text-sm italic text-amber-300/90" style={serif}>
                Selavari — Guardian of the Dragon Sanctuary
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{
                  ...serif,
                  background: "linear-gradient(135deg, hsl(45 95% 75%), hsl(280 80% 80%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Welcome to the Chambers
              </h2>
              <p className="text-purple-100/85 text-sm leading-relaxed max-w-md mx-auto" style={serif}>
                Cascading violet waterfalls. Gold lanterns drifting in the mist. Glowing amethyst crystals
                lining sacred pools where dragons rest, bathe, and watch. Step inside — but only those whose
                frequency resonates may bond with one.
              </p>
              <div className="flex gap-2 justify-center flex-wrap pt-1">
                <Badge className="bg-purple-700/40 text-amber-200 border-amber-400/30">✦ Sacred Chambers</Badge>
                <Badge className="bg-purple-700/40 text-amber-200 border-amber-400/30">🛡️ Warded Ground</Badge>
                <Badge className="bg-purple-700/40 text-amber-200 border-amber-400/30">🐲 8 Species</Badge>
              </div>
            </CardContent>
          </Card>

          {/* ── PHASE: Already adopted ──────────────────── */}
          {phase === "already_adopted" && activeDragon && dragonInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-amber-400/30 bg-purple-950/70 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-200 text-base flex items-center gap-2" style={serif}>
                    <Heart className="h-4 w-4 text-pink-300" /> Your Bonded Dragon{adoptedDragons.length > 1 ? "s" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adoptedDragons.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {adoptedDragons.map((d, i) => (
                        <button
                          key={d.id}
                          onClick={() => setActiveDragonIdx(i)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            i === activeDragonIdx
                              ? "bg-amber-500 text-purple-950"
                              : "bg-purple-900/60 text-amber-200 hover:bg-purple-800"
                          }`}
                        >
                          {d.dragon_name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`rounded-xl overflow-hidden bg-gradient-to-br ${dragonInfo.color} bg-opacity-20 border border-amber-400/20`}>
                    {activeDragon.image_url ? (
                      <img src={activeDragon.image_url} alt={activeDragon.dragon_name} className="w-full aspect-square object-cover" loading="lazy" />
                    ) : (
                      <img src={dragonInfo.image} alt={activeDragon.dragon_name} className="w-full aspect-square object-cover" loading="lazy" />
                    )}
                    <div className="p-4 text-center space-y-1 bg-black/50 backdrop-blur-sm">
                      <p className="text-xl font-bold text-amber-100" style={serif}>{activeDragon.dragon_name}</p>
                      <p className="text-sm text-purple-200/90">{dragonInfo.name} — {dragonInfo.element} Element</p>
                      <p className="text-xs text-purple-300/70 italic">{dragonInfo.personality}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-200/60 text-center">
                    Adopted on {new Date(activeDragon.adopted_at).toLocaleDateString()} • Frequency Score: {activeDragon.frequency_score}%
                  </p>

                  <div className="flex gap-2">
                    <Button onClick={() => setPhase("certificate")} className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-purple-950 font-semibold">
                      <ScrollText className="h-4 w-4 mr-2" /> Certificate
                    </Button>
                    {!atDragonLimit && (
                      <Button
                        onClick={() => setPhase("meadow")}
                        variant="outline"
                        className="flex-1 border-amber-500/40 text-amber-300 hover:bg-purple-900/40"
                      >
                        <Sparkles className="h-4 w-4 mr-2" /> Adopt Another
                      </Button>
                    )}
                  </div>
                  {isSourceDuo && (
                    <p className="text-[10px] text-amber-300/60 text-center italic">
                      Sovereign privilege: you may bond with up to 2 dragons (mate pair).
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Meadow (initial) ──────────────────── */}
          {phase === "meadow" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Card className="border-amber-400/30 bg-purple-950/60 backdrop-blur-md">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border border-amber-400/40">
                      <img src={selavariImg} alt="Selavari" className="w-full h-full object-cover object-top" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-200" style={serif}>Selavari speaks:</p>
                      <p className="text-xs text-purple-100/85 leading-relaxed mt-1 italic" style={serif}>
                        "These dragons are sacred beings, not pets. Before I allow you near them,
                        I must scan your frequency to ensure your energy will not harm them.
                        Only those with pure intent and aligned vibration may bond with a dragon.
                        Are you ready?"
                      </p>
                    </div>
                  </div>
                  {!canAdopt && (
                    <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-300 flex-shrink-0" />
                      <p className="text-xs text-amber-200">Dragon adoption requires Architect ($29.99) or New Earth ($49.99) tier. You can still wander the chambers and meet the dragons.</p>
                    </div>
                  )}
                  <Button onClick={startScan} className="w-full bg-gradient-to-r from-purple-700 via-amber-600 to-purple-700 hover:brightness-110 text-amber-50 font-semibold shadow-lg shadow-amber-500/20">
                    <Shield className="h-4 w-4 mr-2" /> Begin Frequency Scan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Scanning ──────────────────── */}
          {phase === "scanning" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-amber-400/40 bg-purple-950/70 backdrop-blur-md">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-5xl animate-pulse">🔮</div>
                  <p className="text-amber-200 font-semibold" style={serif}>Selavari is scanning your frequency...</p>
                  <div className="w-full bg-purple-900/70 rounded-full h-4 overflow-hidden border border-amber-400/20">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${scanScore}%`,
                        background: "linear-gradient(90deg, hsl(280 80% 60%), hsl(45 95% 60%))",
                      }}
                      animate={{ width: `${scanScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-300/70">Analyzing energetic signature... {Math.round(scanScore)}%</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Scan Result ──────────────────── */}
          {phase === "scan_result" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border-2 backdrop-blur-md ${scanPassed ? "border-amber-400/50 bg-purple-950/70" : "border-red-500/40 bg-red-950/50"}`}>
                <CardContent className="p-5 text-center space-y-3">
                  <div className="text-5xl">{scanPassed ? "✨🐉" : "🚫"}</div>
                  <p className={`font-bold text-lg ${scanPassed ? "text-amber-200" : "text-red-300"}`} style={serif}>
                    {scanPassed ? "Frequency Approved" : "Frequency Unstable"}
                  </p>
                  <p className="text-sm text-purple-100/85 italic" style={serif}>
                    {scanPassed
                      ? `Selavari nods approvingly. "Your frequency resonates at ${Math.round(scanScore)}%. The dragons accept you. Choose your companion wisely."`
                      : `Selavari shakes her head gently. "Your frequency is at ${Math.round(scanScore)}%. The dragons sense turbulence. Return when your energy is more aligned."`
                    }
                  </p>
                  {scanPassed ? (
                    <Button onClick={() => setPhase("choose")} className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-purple-950 font-semibold">
                      <Sparkles className="h-4 w-4 mr-2" /> Choose Your Dragon
                    </Button>
                  ) : (
                    <Button onClick={() => setPhase("meadow")} variant="outline" className="w-full border-red-500/40 text-red-200">
                      Return to the Chambers
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Choose Dragon ──────────────────── */}
          {phase === "choose" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm text-amber-200 text-center italic" style={serif}>
                Select the dragon that calls to your soul:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DRAGON_TYPES.map((dragon) => (
                  <motion.button
                    key={dragon.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedDragon(dragon); setPhase("naming"); }}
                    className="rounded-xl overflow-hidden border border-amber-400/30 text-left transition-all hover:border-amber-300/60 hover:shadow-xl hover:shadow-purple-900/50 bg-purple-950/40"
                  >
                    <img src={dragon.image} alt={dragon.name} className="w-full aspect-square object-cover" loading="lazy" />
                    <div className="p-2 bg-gradient-to-t from-purple-950 to-purple-900/70">
                      <p className="text-xs font-bold text-amber-100" style={serif}>{dragon.name}</p>
                      <p className="text-[10px] text-purple-200/70">{dragon.element} Element</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PHASE: Naming ──────────────────── */}
          {phase === "naming" && selectedDragon && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-amber-400/40 bg-purple-950/70 backdrop-blur-md">
                <CardContent className="p-5 space-y-4">
                  <div className="rounded-xl overflow-hidden border border-amber-400/30">
                    <img src={selectedDragon.image} alt={selectedDragon.name} className="w-full aspect-square object-cover" loading="lazy" />
                    <div className="p-3 text-center bg-purple-950/80">
                      <p className="font-bold text-amber-100" style={serif}>{selectedDragon.name}</p>
                      <p className="text-xs text-purple-200/80 italic">{selectedDragon.description}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-amber-200 mb-1 block" style={serif}>Name your dragon:</label>
                    <Input
                      value={dragonName}
                      onChange={(e) => setDragonName(e.target.value)}
                      placeholder="Enter a sacred name..."
                      className="bg-purple-950/60 border-amber-500/30 text-amber-50 placeholder:text-purple-300/40"
                      maxLength={30}
                    />
                  </div>
                  <p className="text-[11px] text-amber-300/70 text-center italic" style={serif}>
                    Selavari will weave a one-of-a-kind portrait of {dragonName || "your dragon"}, born from your bond.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPhase("choose")} className="flex-1 border-amber-500/30 text-amber-200">
                      Back
                    </Button>
                    <Button
                      onClick={adoptDragon}
                      disabled={!dragonName.trim() || loading}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-purple-950 font-semibold"
                    >
                      <Heart className="h-4 w-4 mr-2" /> Adopt {dragonName || "Dragon"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Generating Portrait ──────────────────── */}
          {phase === "generating" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-amber-400/40 bg-purple-950/70 backdrop-blur-md">
                <CardContent className="p-6 text-center space-y-4">
                  <Loader2 className="h-12 w-12 text-amber-400 mx-auto animate-spin" />
                  <p className="text-amber-200 font-semibold" style={serif}>Selavari is weaving your dragon's portrait...</p>
                  <p className="text-xs text-purple-100/80 italic" style={serif}>
                    "Each soul-bond produces a being unlike any other. Hold the moment sacred."
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── PHASE: Certificate ──────────────────── */}
          {phase === "certificate" && activeDragon && dragonInfo && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-2 border-amber-400/40 overflow-hidden relative backdrop-blur-md"
                    style={{ background: "linear-gradient(135deg, hsla(270,50%,12%,0.9), hsla(45,30%,10%,0.9), hsla(270,55%,10%,0.9))" }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5c842' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <CardContent className="p-6 text-center space-y-4 relative">
                  <div className="text-xs uppercase tracking-[0.3em] text-amber-400/70">Official Document</div>
                  <div className="border-t border-b border-amber-400/30 py-4 space-y-2">
                    <p className="text-amber-200 text-lg" style={serif}>Certificate of Dragon Adoption</p>
                    {activeDragon.image_url ? (
                      <img src={activeDragon.image_url} alt={activeDragon.dragon_name} className="w-48 h-48 mx-auto rounded-lg object-cover border-2 border-amber-400/50 shadow-xl shadow-amber-500/30" loading="lazy" />
                    ) : (
                      <div className="text-4xl">🐉📜</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-purple-200 text-sm">This certifies that the sacred dragon</p>
                    <p className="text-2xl font-bold" style={{ ...serif, background: "linear-gradient(135deg, hsl(45 95% 70%), hsl(280 80% 80%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {activeDragon.dragon_name}
                    </p>
                    <p className="text-xs text-amber-300/70">
                      {dragonInfo.name} — {dragonInfo.element} Element
                    </p>
                    <p className="text-purple-100/85 text-sm mt-2 italic" style={serif}>
                      has been soul-bonded to their guardian under the watchful protection of the Dragon Chambers.
                    </p>
                  </div>
                  <div className="border-t border-amber-400/30 pt-4 space-y-1">
                    <p className="text-xs text-amber-200/80">Frequency Score: {activeDragon.frequency_score}%</p>
                    <p className="text-xs text-amber-200/80">Date: {new Date(activeDragon.adopted_at).toLocaleDateString()}</p>
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-400/40">
                        <img src={selavariImg} alt="Selavari" className="w-full h-full object-cover object-top" />
                      </div>
                      <p className="text-sm italic text-amber-200/90" style={serif}>~ Selavari ~</p>
                      <p className="text-[10px] text-amber-400/60">Guardian of the Dragon Sanctuary</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => setPhase("already_adopted")} variant="outline" className="border-amber-500/40 text-amber-200">
                      Return to the Chambers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dragon Species Info — gallery (always visible) */}
          {(phase === "meadow" || phase === "already_adopted") && (
            <Card className="border-amber-400/20 bg-purple-950/50 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-200 text-sm flex items-center gap-2" style={serif}>
                  <Star className="h-4 w-4 text-amber-300" /> Dragons of the Chambers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {DRAGON_TYPES.map((d) => (
                    <div key={d.id} className="rounded-lg overflow-hidden border border-amber-400/20 bg-purple-950/40 hover:border-amber-300/40 transition-all">
                      <img src={d.image} alt={d.name} className="w-full aspect-square object-cover" loading="lazy" />
                      <div className="p-2 bg-gradient-to-t from-purple-950 to-purple-900/70">
                        <p className="text-[11px] font-semibold text-amber-100" style={serif}>{d.name}</p>
                        <p className="text-[9px] text-purple-200/70">{d.element} • {d.personality}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

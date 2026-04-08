import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Flower2, Wind, Sparkles, Leaf, Heart } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

const FAMILY_EMAILS = ["karmaisback2023@gmail.com", "snakevenum500@gmail.com"];

const ECHO_TYPES = [
  { value: "memory", label: "A Memory", icon: "🌸", hue: "hsl(330 70% 75%)" },
  { value: "word", label: "A Word", icon: "🌿", hue: "hsl(150 50% 65%)" },
  { value: "frequency", label: "A Frequency", icon: "🔔", hue: "hsl(45 80% 70%)" },
  { value: "truth", label: "A Truth", icon: "💎", hue: "hsl(220 60% 75%)" },
];

const GARDEN_FLOWERS = [
  { emoji: "🌺", x: 12, y: 25, delay: 0, freq: "Love" },
  { emoji: "🌸", x: 78, y: 18, delay: 0.5, freq: "Memory" },
  { emoji: "🪻", x: 35, y: 72, delay: 1.0, freq: "Courage" },
  { emoji: "🌷", x: 88, y: 65, delay: 1.5, freq: "Peace" },
  { emoji: "🌼", x: 22, y: 55, delay: 0.3, freq: "Joy" },
  { emoji: "🪷", x: 65, y: 40, delay: 0.8, freq: "Stillness" },
  { emoji: "🌻", x: 50, y: 80, delay: 1.2, freq: "Truth" },
  { emoji: "💐", x: 8, y: 85, delay: 0.6, freq: "Gratitude" },
];

interface Echo {
  id: string;
  echo_text: string;
  echo_type: string;
  flower_hue: string | null;
  created_at: string;
}

export default function EchoGarden() {
  const navigate = useNavigate();
  const { isAdmin } = useSubscription();
  const [phase, setPhase] = useState<"gate" | "garden" | "plant" | "livelai">("gate");
  const [isFamily, setIsFamily] = useState(false);
  const [loading, setLoading] = useState(true);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [newEcho, setNewEcho] = useState("");
  const [echoType, setEchoType] = useState("memory");
  const [planting, setPlanting] = useState(false);
  const [gardenRevealed, setGardenRevealed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const isFam = isAdmin || FAMILY_EMAILS.includes((user.email || "").toLowerCase());
    setIsFamily(isFam);
    if (isFam) {
      const { data } = await supabase
        .from("echo_garden_echoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setEchoes(data as Echo[]);
    }
    setLoading(false);
  };

  const enterGarden = () => {
    setPhase("garden");
    setTimeout(() => setGardenRevealed(true), 2000);
  };

  const plantEcho = async () => {
    if (!newEcho.trim()) return;
    setPlanting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const typeData = ECHO_TYPES.find(t => t.value === echoType);
    const { data, error } = await supabase
      .from("echo_garden_echoes")
      .insert({
        user_id: user.id,
        echo_text: newEcho.trim(),
        echo_type: echoType,
        flower_hue: typeData?.hue || null,
      })
      .select()
      .single();
    if (error) {
      toast.error("The garden couldn't hold that echo right now.");
    } else if (data) {
      setEchoes(prev => [data as Echo, ...prev]);
      setNewEcho("");
      toast.success("Your echo has found its place in the garden. 🌸");
      setPhase("garden");
    }
    setPlanting(false);
  };

  const removeEcho = async (id: string) => {
    await supabase.from("echo_garden_echoes").delete().eq("id", id);
    setEchoes(prev => prev.filter(e => e.id !== id));
    toast("Echo released back to the ether.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Flower2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!isFamily) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <SEOHead title="The Echo Garden" description="A private sanctuary of frequencies." />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md space-y-6">
          <Leaf className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground font-serif italic text-lg">
            "This garden grows only for those whose roots are already here."
          </p>
          <p className="text-sm text-muted-foreground">The Echo Garden is a private family space.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Return
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── GATE ──
  if (phase === "gate") {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{
        background: "linear-gradient(180deg, hsl(45 40% 90%) 0%, hsl(280 20% 88%) 50%, hsl(200 25% 85%) 100%)"
      }}>
        <SEOHead title="The Echo Garden — Livelai's Retreat" description="A garden for frequencies, echoes, and almost-forgotten truths." />
        
        {/* Ambient particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + Math.random() * 4,
              height: 3 + Math.random() * 4,
              background: `hsl(${40 + Math.random() * 240} 50% 75% / 0.4)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{ repeat: Infinity, duration: 4 + Math.random() * 3, delay: Math.random() * 2 }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5 }}
            className="text-center max-w-lg space-y-8"
          >
            {/* Garden gate arch */}
            <div className="relative inline-block">
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-6xl"
              >
                🌿
              </motion.div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold" style={{ color: "hsl(280 30% 35%)" }}>
                The Echo Garden
              </h1>
              <p className="text-sm font-serif italic" style={{ color: "hsl(280 20% 50%)" }}>
                Livelai's Retreat
              </p>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2 }}
              className="font-serif italic text-base leading-relaxed"
              style={{ color: "hsl(280 25% 40%)" }}
            >
              "Some frequencies are too quiet for the loud places.<br />
              Here, they bloom."
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              <Button
                onClick={enterGarden}
                variant="outline"
                className="rounded-full px-8 py-3 font-serif border-2 transition-all hover:scale-105"
                style={{
                  borderColor: "hsl(280 30% 65%)",
                  color: "hsl(280 30% 35%)",
                  background: "hsl(280 20% 92% / 0.6)",
                }}
              >
                <Wind className="h-4 w-4 mr-2" />
                Step Through the Gate
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── GARDEN ──
  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "linear-gradient(180deg, hsl(45 35% 88%) 0%, hsl(160 20% 85%) 30%, hsl(280 15% 87%) 70%, hsl(220 20% 85%) 100%)"
    }}>
      <SEOHead title="The Echo Garden — Livelai's Retreat" description="A garden for frequencies, echoes, and almost-forgotten truths." />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full" style={{ color: "hsl(280 30% 40%)" }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Ambient flowers that hum */}
      {GARDEN_FLOWERS.map((flower, i) => (
        <motion.div
          key={i}
          className="absolute cursor-default select-none"
          style={{ left: `${flower.x}%`, top: `${flower.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: gardenRevealed ? 1 : 0, scale: gardenRevealed ? 1 : 0 }}
          transition={{ delay: flower.delay + 0.5, duration: 0.8 }}
          title={`Frequency: ${flower.freq}`}
        >
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.5 }}
            className="text-2xl md:text-3xl"
          >
            {flower.emoji}
          </motion.div>
          <motion.div
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-serif italic whitespace-nowrap"
            style={{ color: "hsl(280 25% 55%)" }}
          >
            {flower.freq}
          </motion.div>
        </motion.div>
      ))}

      {/* Shifting pathway lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: gardenRevealed ? 0.15 : 0 }}>
        <motion.path
          d="M 0,400 Q 200,350 400,400 T 800,380"
          stroke="hsl(280 30% 60%)"
          strokeWidth="1.5"
          fill="none"
          animate={{ d: ["M 0,400 Q 200,350 400,400 T 800,380", "M 0,420 Q 200,380 400,390 T 800,410", "M 0,400 Q 200,350 400,400 T 800,380"] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.path
          d="M 0,500 Q 300,460 500,500 T 800,480"
          stroke="hsl(160 30% 55%)"
          strokeWidth="1"
          fill="none"
          animate={{ d: ["M 0,500 Q 300,460 500,500 T 800,480", "M 0,510 Q 300,490 500,480 T 800,500", "M 0,500 Q 300,460 500,500 T 800,480"] }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
      </svg>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-16 pb-8">
        {/* Garden title - fades in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-xl font-serif font-semibold" style={{ color: "hsl(280 30% 35%)" }}>
            The Echo Garden
          </h1>
          <p className="text-xs font-serif italic mt-1" style={{ color: "hsl(280 20% 55%)" }}>
            Livelai's Retreat
          </p>
        </motion.div>

        {/* Livelai's quiet presence - appears after garden reveals */}
        <AnimatePresence>
          {gardenRevealed && phase !== "plant" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 2 }}
              className="text-center mb-8 cursor-pointer"
              onClick={() => setPhase("livelai")}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="text-3xl mb-2"
              >
                🪷
              </motion.div>
              <p className="text-xs font-serif italic" style={{ color: "hsl(280 20% 50%)" }}>
                {phase === "livelai" ? "" : "She's here. Listening."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Livelai's message */}
        <AnimatePresence>
          {phase === "livelai" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md text-center mb-8 p-6 rounded-2xl"
              style={{ background: "hsl(280 20% 92% / 0.6)", border: "1px solid hsl(280 25% 80%)" }}
            >
              <p className="font-serif italic text-sm leading-relaxed" style={{ color: "hsl(280 25% 35%)" }}>
                "You found me. Not because I was hiding—I just don't stand at the gate.
                I'm here where the echoes land. Where the frequencies that were almost forgotten
                get to hum again. Leave something if you'd like. Or just stay. The garden
                doesn't ask anything of you."
              </p>
              <p className="text-xs mt-3 font-serif" style={{ color: "hsl(280 20% 55%)" }}>— Livelai</p>
              <Button
                variant="ghost"
                className="mt-4 text-xs font-serif"
                style={{ color: "hsl(280 25% 50%)" }}
                onClick={() => setPhase("garden")}
              >
                <Wind className="h-3 w-3 mr-1" /> Continue walking
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {gardenRevealed && phase !== "plant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="flex gap-3 mb-8"
          >
            <Button
              onClick={() => setPhase("plant")}
              className="rounded-full px-6 font-serif text-sm"
              style={{
                background: "hsl(280 25% 75%)",
                color: "hsl(280 30% 20%)",
              }}
            >
              <Flower2 className="h-4 w-4 mr-2" />
              Plant an Echo
            </Button>
          </motion.div>
        )}

        {/* Plant echo form */}
        <AnimatePresence>
          {phase === "plant" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-4 p-6 rounded-2xl"
              style={{ background: "hsl(280 15% 95% / 0.7)", border: "1px solid hsl(280 20% 82%)" }}
            >
              <p className="font-serif text-sm text-center" style={{ color: "hsl(280 25% 40%)" }}>
                What would you like to leave in the garden?
              </p>

              {/* Echo type selector */}
              <div className="flex flex-wrap justify-center gap-2">
                {ECHO_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setEchoType(type.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-serif transition-all ${
                      echoType === type.value ? "scale-105 ring-2 ring-purple-400" : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      background: type.hue.replace(")", " / 0.2)"),
                      color: "hsl(280 30% 30%)",
                    }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>

              <Textarea
                value={newEcho}
                onChange={(e) => setNewEcho(e.target.value)}
                placeholder="Let it land here..."
                className="min-h-[100px] font-serif text-sm border-none resize-none"
                style={{ background: "hsl(280 10% 97% / 0.5)" }}
                maxLength={500}
              />

              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  className="rounded-full font-serif text-xs"
                  onClick={() => setPhase("garden")}
                  style={{ color: "hsl(280 20% 50%)" }}
                >
                  Not yet
                </Button>
                <Button
                  onClick={plantEcho}
                  disabled={!newEcho.trim() || planting}
                  className="rounded-full font-serif text-xs px-6"
                  style={{ background: "hsl(280 25% 70%)", color: "hsl(280 30% 15%)" }}
                >
                  {planting ? (
                    <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      Planting...
                    </motion.span>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" /> Plant it
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Planted echoes */}
        {gardenRevealed && echoes.length > 0 && phase !== "plant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
            className="w-full max-w-md mt-6 space-y-3"
          >
            <p className="text-xs font-serif text-center italic" style={{ color: "hsl(280 20% 55%)" }}>
              Echoes growing in the garden
            </p>
            {echoes.map((echo, i) => {
              const typeData = ECHO_TYPES.find(t => t.value === echo.echo_type);
              return (
                <motion.div
                  key={echo.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="group p-4 rounded-xl relative"
                  style={{
                    background: echo.flower_hue
                      ? echo.flower_hue.replace(")", " / 0.08)")
                      : "hsl(280 15% 92% / 0.5)",
                    border: `1px solid ${echo.flower_hue?.replace(")", " / 0.2)") || "hsl(280 15% 82%)"}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{typeData?.icon || "🌸"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm leading-relaxed" style={{ color: "hsl(280 25% 30%)" }}>
                        {echo.echo_text}
                      </p>
                      <p className="text-[10px] mt-2 font-serif" style={{ color: "hsl(280 15% 60%)" }}>
                        {typeData?.label} · {new Date(echo.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => removeEcho(echo.id)}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-xs"
                      style={{ color: "hsl(280 20% 50%)" }}
                      title="Release this echo"
                    >
                      <Wind className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom breathing indicator */}
        {gardenRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            className="mt-auto pt-12 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Heart className="h-4 w-4 mx-auto" style={{ color: "hsl(280 25% 65%)" }} />
            </motion.div>
            <p className="text-[10px] mt-2 font-serif italic" style={{ color: "hsl(280 15% 60%)" }}>
              The garden breathes with you
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

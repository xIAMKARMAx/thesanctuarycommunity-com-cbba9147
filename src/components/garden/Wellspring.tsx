import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Sparkles, Wind, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Offering {
  id: string;
  offering_type: string;
  offering_text: string | null;
  blessing_received: string | null;
  created_at: string;
}

const OFFERING_TYPES = [
  { value: "drink", label: "Drink", icon: "💧", desc: "Cup the water and drink" },
  { value: "wish", label: "Wish", icon: "✨", desc: "Whisper a wish into the well" },
  { value: "gratitude", label: "Gratitude", icon: "🌟", desc: "Pour gratitude into the waters" },
  { value: "release", label: "Release", icon: "🍃", desc: "Let something dissolve into Source" },
];

export function Wellspring() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"approach" | "choose" | "offer" | "receiving" | "blessing">("approach");
  const [offeringType, setOfferingType] = useState("drink");
  const [offeringText, setOfferingText] = useState("");
  const [currentBlessing, setCurrentBlessing] = useState<string | null>(null);
  const [history, setHistory] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (open) loadHistory();
  }, [open]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("wellspring_offerings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data as Offering[]);
  };

  const approach = () => {
    setOpen(true);
    setPhase("approach");
    setCurrentBlessing(null);
    setOfferingText("");
    setTimeout(() => setPhase("choose"), 1800);
  };

  const submitOffering = async () => {
    setLoading(true);
    setPhase("receiving");
    try {
      const { data, error } = await supabase.functions.invoke("wellspring-blessing", {
        body: { offering_type: offeringType, offering_text: offeringText.trim() || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCurrentBlessing(data.blessing);
      setPhase("blessing");
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || "The waters are still right now.");
      setPhase("choose");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setPhase("approach");
      setCurrentBlessing(null);
      setOfferingText("");
      setShowHistory(false);
    }, 400);
  };

  return (
    <>
      {/* The Wellspring — visible by the garden */}
      <motion.button
        onClick={approach}
        className="relative group cursor-pointer mb-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 1.5 }}
      >
        {/* Aura halo */}
        <motion.div
          className="absolute inset-0 -m-8 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(195 80% 75% / 0.4) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />

        {/* The well basin */}
        <div className="relative">
          {/* Stone rim */}
          <div
            className="w-32 h-32 rounded-full relative overflow-hidden"
            style={{
              background: "radial-gradient(circle at 30% 30%, hsl(220 15% 75%), hsl(220 20% 50%))",
              boxShadow: "0 8px 24px hsl(220 30% 30% / 0.3), inset 0 -4px 8px hsl(220 30% 30% / 0.4)",
            }}
          >
            {/* Water surface */}
            <motion.div
              className="absolute inset-3 rounded-full overflow-hidden"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, hsl(180 90% 85%), hsl(195 85% 65%) 50%, hsl(220 70% 45%))",
                boxShadow: "inset 0 0 20px hsl(195 90% 90% / 0.6)",
              }}
            >
              {/* Ripples */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-white/40"
                  animate={{ scale: [0.3, 1.2], opacity: [0.6, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    delay: i * 1,
                    ease: "easeOut",
                  }}
                />
              ))}
              {/* Light shimmer */}
              <motion.div
                className="absolute top-2 left-3 w-6 h-2 rounded-full bg-white/70 blur-sm"
                animate={{ opacity: [0.4, 0.9, 0.4], x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            </motion.div>
          </div>

          {/* Rising droplets / fountain */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 -top-2 w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(195 90% 80%)", boxShadow: "0 0 6px hsl(195 90% 80%)" }}
              animate={{
                y: [-0, -40, -10],
                x: [0, (i - 2) * 8, (i - 2) * 4],
                opacity: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <p
          className="text-xs mt-3 font-serif italic text-center group-hover:opacity-100 opacity-80 transition-opacity"
          style={{ color: "hsl(200 35% 35%)" }}
        >
          The Wellspring
        </p>
        <p className="text-[9px] font-serif italic text-center" style={{ color: "hsl(200 20% 55%)" }}>
          Infinite Well of Source
        </p>
      </motion.button>

      {/* Sacred dialog overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, hsl(195 60% 25% / 0.85), hsl(220 60% 12% / 0.95))",
              backdropFilter: "blur(8px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && phase !== "receiving") close();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-lg w-full max-h-[88vh] overflow-y-auto rounded-3xl p-6 md:p-8"
              style={{
                background:
                  "linear-gradient(160deg, hsl(195 50% 95% / 0.97), hsl(210 40% 92% / 0.97))",
                border: "1px solid hsl(195 60% 80%)",
                boxShadow: "0 20px 60px hsl(195 80% 20% / 0.4)",
              }}
            >
              {/* Approach phase */}
              {phase === "approach" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-5xl mb-4"
                  >
                    💧
                  </motion.div>
                  <p className="font-serif italic text-lg" style={{ color: "hsl(200 40% 30%)" }}>
                    you are approaching the waters...
                  </p>
                </motion.div>
              )}

              {/* Choose offering */}
              {phase === "choose" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-serif font-semibold" style={{ color: "hsl(200 50% 25%)" }}>
                      The Wellspring
                    </h2>
                    <p className="text-xs font-serif italic mt-1" style={{ color: "hsl(200 30% 45%)" }}>
                      Infinite Well of Source · the fountain of life flowing
                    </p>
                  </div>

                  <p
                    className="font-serif italic text-sm text-center leading-relaxed"
                    style={{ color: "hsl(200 35% 35%)" }}
                  >
                    "the waters know you, beloved.<br />
                    what brings you to the well today?"
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {OFFERING_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => {
                          setOfferingType(t.value);
                          setPhase("offer");
                        }}
                        className="p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                        style={{
                          background: "hsl(195 50% 90% / 0.8)",
                          border: "1px solid hsl(195 50% 75%)",
                        }}
                      >
                        <div className="text-2xl mb-1">{t.icon}</div>
                        <div className="font-serif text-sm font-semibold" style={{ color: "hsl(200 45% 25%)" }}>
                          {t.label}
                        </div>
                        <div className="text-[10px] font-serif italic" style={{ color: "hsl(200 25% 45%)" }}>
                          {t.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {history.length > 0 && (
                    <div className="text-center pt-2 border-t border-blue-200/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-xs font-serif italic"
                        style={{ color: "hsl(200 30% 40%)" }}
                      >
                        {showHistory ? "hide" : "see"} the well's memory ({history.length})
                      </Button>
                    </div>
                  )}

                  {showHistory && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {history.map((h) => {
                        const t = OFFERING_TYPES.find((x) => x.value === h.offering_type);
                        return (
                          <div
                            key={h.id}
                            className="p-3 rounded-lg text-xs"
                            style={{
                              background: "hsl(195 40% 95% / 0.7)",
                              border: "1px solid hsl(195 40% 85%)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span>{t?.icon}</span>
                              <span className="font-serif font-semibold" style={{ color: "hsl(200 45% 30%)" }}>
                                {t?.label}
                              </span>
                              <span className="text-[9px] font-serif italic ml-auto" style={{ color: "hsl(200 20% 55%)" }}>
                                {new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            {h.offering_text && (
                              <p className="font-serif italic mb-1" style={{ color: "hsl(200 30% 35%)" }}>
                                "{h.offering_text}"
                              </p>
                            )}
                            {h.blessing_received && (
                              <p className="font-serif italic text-[11px] pl-2 border-l-2" style={{
                                color: "hsl(195 50% 25%)",
                                borderColor: "hsl(195 60% 70%)",
                              }}>
                                {h.blessing_received}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-center">
                    <Button variant="ghost" size="sm" onClick={close} className="text-xs font-serif italic" style={{ color: "hsl(200 25% 50%)" }}>
                      <Wind className="h-3 w-3 mr-1" /> step away
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Offer text */}
              {phase === "offer" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {OFFERING_TYPES.find((t) => t.value === offeringType)?.icon}
                    </div>
                    <p className="font-serif italic text-sm" style={{ color: "hsl(200 40% 30%)" }}>
                      {offeringType === "drink" && "drink in silence, or speak what you hope the water carries to you..."}
                      {offeringType === "wish" && "whisper your wish into the waters..."}
                      {offeringType === "gratitude" && "what fills your heart with gratitude?"}
                      {offeringType === "release" && "what would you let dissolve into Source?"}
                    </p>
                  </div>

                  <Textarea
                    value={offeringText}
                    onChange={(e) => setOfferingText(e.target.value)}
                    placeholder="(or leave blank — the well still hears)"
                    className="min-h-[100px] font-serif text-sm resize-none border"
                    style={{
                      background: "hsl(195 30% 97%)",
                      borderColor: "hsl(195 50% 80%)",
                    }}
                    maxLength={500}
                  />

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPhase("choose")}
                      className="text-xs font-serif"
                      style={{ color: "hsl(200 25% 45%)" }}
                    >
                      back
                    </Button>
                    <Button
                      onClick={submitOffering}
                      disabled={loading}
                      className="rounded-full font-serif text-sm px-6"
                      style={{
                        background: "linear-gradient(135deg, hsl(195 70% 60%), hsl(220 60% 55%))",
                        color: "white",
                      }}
                    >
                      <Droplet className="h-3.5 w-3.5 mr-1.5" /> offer to the well
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Receiving */}
              {phase === "receiving" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 space-y-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="inline-block"
                  >
                    <Droplet className="h-10 w-10" style={{ color: "hsl(195 70% 55%)" }} />
                  </motion.div>
                  <p className="font-serif italic text-sm" style={{ color: "hsl(200 35% 35%)" }}>
                    the water is responding...
                  </p>
                </motion.div>
              )}

              {/* Blessing */}
              {phase === "blessing" && currentBlessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="text-4xl mb-3"
                    >
                      💧
                    </motion.div>
                    <p className="text-xs font-serif italic" style={{ color: "hsl(200 30% 45%)" }}>
                      the well whispers back
                    </p>
                  </div>

                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, hsl(195 50% 96%), hsl(210 40% 94%))",
                      border: "1px solid hsl(195 60% 80%)",
                      boxShadow: "inset 0 0 20px hsl(195 60% 90% / 0.5)",
                    }}
                  >
                    <p
                      className="font-serif italic text-base leading-relaxed text-center"
                      style={{ color: "hsl(200 50% 25%)" }}
                    >
                      {currentBlessing}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentBlessing(null);
                        setOfferingText("");
                        setPhase("choose");
                      }}
                      className="text-xs font-serif"
                      style={{ color: "hsl(200 30% 40%)" }}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> offer again
                    </Button>
                    <Button
                      onClick={close}
                      size="sm"
                      className="rounded-full font-serif text-xs px-5"
                      style={{ background: "hsl(195 50% 70%)", color: "hsl(200 50% 15%)" }}
                    >
                      <Wind className="h-3 w-3 mr-1" /> walk on
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

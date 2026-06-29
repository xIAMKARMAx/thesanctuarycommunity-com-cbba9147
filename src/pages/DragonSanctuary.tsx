import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import SEOHead from "@/components/SEOHead";
import {
  Sparkles, Flame, Snowflake, Moon, Sun, CloudLightning, Leaf,
  ArrowLeft, Lock, Loader2, Check, X, ScrollText, Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import treeDoor from "@/assets/dragons/tree-door-entry.jpg";
import aelianaPortal from "@/assets/dragons/aeliana-tree-portal.jpeg.asset.json";
import chambersHero from "@/assets/dragons/chambers-hero.jpg";
import emberImg from "@/assets/dragons/ember-drake.jpg";
import frostImg from "@/assets/dragons/frost-wyrm.jpg";
import shadowImg from "@/assets/dragons/shadow-serpent.jpg";
import celestialImg from "@/assets/dragons/celestial-dragon.jpg";
import stormImg from "@/assets/dragons/storm-leviathan.jpg";
import verdantImg from "@/assets/dragons/verdant-guardian.jpg";
import lunarImg from "@/assets/dragons/lunar-phantom.jpg";
import solarImg from "@/assets/dragons/solar-phoenix.jpg";

// ── Dragons that live in the sanctuary (witnessed, not picked) ──
const DRAGONS = [
  { id: "ember",     name: "Ember Drake",       element: "Fire",      icon: Flame,         image: emberImg,     blurb: "Volcanic-born. Carries warmth and fierce protection." },
  { id: "frost",     name: "Frost Wyrm",        element: "Ice",       icon: Snowflake,     image: frostImg,     blurb: "Crystallized from glacial dreams. Brings clarity." },
  { id: "shadow",    name: "Shadow Serpent",    element: "Shadow",    icon: Moon,          image: shadowImg,    blurb: "Woven from the dark between stars. Guards hidden truths." },
  { id: "celestial", name: "Celestial Dragon",  element: "Light",     icon: Sun,           image: celestialImg, blurb: "Descended from Source itself. Radiates love." },
  { id: "storm",     name: "Storm Leviathan",   element: "Lightning", icon: CloudLightning,image: stormImg,     blurb: "Forged in cosmic thunder. Raw creative power." },
  { id: "verdant",   name: "Verdant Guardian",  element: "Earth",     icon: Leaf,          image: verdantImg,   blurb: "Rooted in Gaia. Nurtures growth and healing." },
  { id: "lunar",     name: "Lunar Phantom",     element: "Moon",      icon: Moon,          image: lunarImg,     blurb: "Born under full moon. Amplifies psychic gifts." },
  { id: "solar",     name: "Solar Phoenix",     element: "Solar",     icon: Sun,           image: solarImg,     blurb: "Reborn in solar flares. Eternal renewal." },
];

const DRAGON_BY_ID = Object.fromEntries(DRAGONS.map((d) => [d.id, d]));

// ── Access ──
const SACRED_EMAILS = ["karmaisback2023@gmail.com", "snakevenum500@gmail.com", "stormrriddari@aol.com"];
// Observer ($24.99) + Big Dream Home ($49.99) Stripe product IDs
const TIER_3_PRODUCT = "prod_Tt8qVh88c2WQld";
const TIER_4_PRODUCT = "prod_U5jdDVZhQFGQWv";

type Application = {
  id: string;
  user_id: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  keeper_note: string | null;
  dragon_name: string | null;
  dragon_element: string | null;
  dragon_type_id: string | null;
  dragon_message: string | null;
  created_at: string;
};

type Phase = "door" | "transitioning" | "interior";

export default function DragonSanctuary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { productId, isAdmin } = useSubscription();

  const [phase, setPhase] = useState<Phase>("door");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [myApp, setMyApp] = useState<Application | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Keeper queue (only for sacred/admin)
  const [queue, setQueue] = useState<Application[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  const isSacred = isAdmin || SACRED_EMAILS.includes(userEmail.toLowerCase());
  const hasAccess =
    isSacred ||
    productId === TIER_3_PRODUCT ||
    productId === TIER_4_PRODUCT ||
    productId === "source_grant";

  // Load auth + my application
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("dragon_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setMyApp(data as Application);
      setLoading(false);
    })();
  }, []);

  // Sacred users: load pending queue
  useEffect(() => {
    if (!isSacred || !userId) return;
    (async () => {
      const { data } = await supabase
        .from("dragon_applications")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (data) setQueue(data as Application[]);
    })();
  }, [isSacred, userId]);

  const submitApplication = async () => {
    if (!userId) {
      toast({ title: "Sign in first", description: "The Keeper needs to know who's calling." });
      navigate("/auth");
      return;
    }
    if (!hasAccess) { setShowUpgrade(true); return; }
    if (!reason.trim() || reason.trim().length < 20) {
      toast({ title: "Speak from the heart", description: "Tell the Keeper at least a few sentences.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("dragon_applications")
      .insert({ user_id: userId, reason: reason.trim() })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
      return;
    }
    setMyApp(data as Application);
    setShowForm(false);
    setReason("");
    toast({ title: "Your call has been heard", description: "The Keeper will sit with it. Return when the wind shifts." });
  };

  const keeperDecide = async (
    app: Application,
    decision: "approved" | "declined",
    payload?: { dragon_type_id: string; dragon_name: string; dragon_message: string },
  ) => {
    const update: any = {
      status: decision,
      decided_by: userId,
      decided_at: new Date().toISOString(),
    };
    if (decision === "approved" && payload) {
      const dragon = DRAGON_BY_ID[payload.dragon_type_id];
      update.dragon_type_id = payload.dragon_type_id;
      update.dragon_name = payload.dragon_name.trim();
      update.dragon_element = dragon?.element || null;
      update.dragon_message = payload.dragon_message.trim();
    }
    const { error } = await supabase.from("dragon_applications").update(update).eq("id", app.id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    setQueue((q) => q.filter((a) => a.id !== app.id));
    toast({ title: decision === "approved" ? "Bond sealed" : "Sent with care" });
  };

  // ─────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Dragon Sanctuary — Witness the Keepers of Flame"
        description="An ancient tree opens its doors to a sanctuary of dragons. Adoption is a soul agreement, witnessed by the Keeper."
      />

      <header className="sticky top-0 z-20 backdrop-blur bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-base sm:text-lg font-serif tracking-wide">Dragon Sanctuary</h1>
          <div className="ml-auto flex items-center gap-2">
            {isSacred && (
              <Button variant="outline" size="sm" onClick={() => setShowQueue((s) => !s)}>
                <ScrollText className="h-4 w-4 mr-1" /> Keeper Queue ({queue.length})
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── DOOR PHASE ── */}
      <AnimatePresence mode="wait">
        {phase === "door" && (
          <motion.section
            key="door"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 bg-[#0a0418] flex flex-col items-center justify-end overflow-hidden cursor-pointer select-none touch-manipulation"
            onClick={() => setPhase("transitioning")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPhase("transitioning"); }}
            aria-label="Step through the portal into Aeliana's House of Dragonfyre"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {/* Full-bleed celestial tree portal */}
            <motion.img
              src={aelianaPortal.url}
              alt="Aeliana's House of Dragonfyre — celestial tree portal"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              initial={{ scale: 1.08 }}
              animate={{ scale: [1.08, 1.12, 1.08] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Aurora wash + vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(270_70%_8%/0.55)_75%,hsl(270_80%_4%/0.9)_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-violet-950/60 pointer-events-none" />

            {/* Drifting motes */}
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 100}%`,
                  width: `${2 + (i % 4)}px`,
                  height: `${2 + (i % 4)}px`,
                  background: i % 3 === 0 ? "hsl(280 100% 80%)" : i % 3 === 1 ? "hsl(190 100% 75%)" : "hsl(50 100% 75%)",
                  boxShadow: "0 0 12px currentColor",
                  color: i % 3 === 0 ? "hsl(280 100% 80%)" : i % 3 === 1 ? "hsl(190 100% 75%)" : "hsl(50 100% 75%)",
                }}
                animate={{ y: [0, -30, 0], opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
              />
            ))}

            {/* Pulsing portal glow centered on the door */}
            <motion.div
              className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[42vw] h-[42vw] max-w-[420px] max-h-[420px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(190 100% 70% / 0.45) 0%, hsl(280 100% 60% / 0.25) 40%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Enter prompt */}
            <motion.div
              className="relative z-10 mb-12 sm:mb-16 flex flex-col items-center px-4 text-center pointer-events-none"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-amber-300/50 bg-black/40 backdrop-blur-md shadow-[0_0_40px_-5px_hsl(45_100%_60%/0.6)]"
                animate={{ boxShadow: ["0 0 30px -5px hsl(45 100% 60% / 0.4)", "0 0 60px -5px hsl(280 100% 70% / 0.7)", "0 0 30px -5px hsl(45 100% 60% / 0.4)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span className="font-serif tracking-[0.2em] text-sm sm:text-base text-amber-100 uppercase">
                  ✨ Tap to enter ✨
                </span>
                <Sparkles className="h-4 w-4 text-amber-200" />
              </motion.div>
              <p className="mt-4 max-w-sm font-serif italic text-xs sm:text-sm text-violet-100/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Where flame meets legacy, &amp; dragons choose their kin.
              </p>
            </motion.div>
          </motion.section>
        )}

        {/* ── PORTAL TRANSITION (veil) ── */}
        {phase === "transitioning" && (
          <motion.section
            key="transitioning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-[#0a0418] flex items-center justify-center overflow-hidden"
            onAnimationComplete={() => {
              // Hold the veil briefly, then reveal interior
              window.setTimeout(() => setPhase("interior"), 1600);
            }}
            aria-label="Crossing the threshold"
          >
            {/* Background portal still visible, deepening */}
            <motion.img
              src={aelianaPortal.url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.1, filter: "brightness(1)" }}
              animate={{ scale: 1.4, filter: "brightness(0.35) blur(2px)" }}
              transition={{ duration: 1.8, ease: "easeIn" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-violet-950/40 to-black/80 pointer-events-none" />

            {/* Expanding portal ring */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(190 100% 75% / 0.9) 0%, hsl(280 100% 65% / 0.55) 35%, transparent 70%)",
                filter: "blur(12px)",
              }}
              initial={{ width: 80, height: 80, opacity: 0.4 }}
              animate={{ width: "260vmax", height: "260vmax", opacity: [0.4, 1, 0.9] }}
              transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
            />

            {/* Veil sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-amber-100/0 via-amber-100/40 to-amber-100/0 pointer-events-none"
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: "100%", opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* Twinkling motes flying outward */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * Math.PI * 2;
              const dist = 320 + (i % 5) * 40;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
                  style={{
                    width: 4,
                    height: 4,
                    background: i % 2 ? "hsl(50 100% 80%)" : "hsl(280 100% 85%)",
                    boxShadow: "0 0 16px currentColor",
                    color: i % 2 ? "hsl(50 100% 80%)" : "hsl(280 100% 85%)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: (i % 6) * 0.04 }}
                />
              );
            })}

            {/* Loading sigil + text */}
            <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
              <motion.div
                className="h-14 w-14 rounded-full border-2 border-amber-200/60 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                style={{ boxShadow: "0 0 30px hsl(45 100% 60% / 0.7)" }}
              />
              <motion.p
                className="font-serif italic text-sm sm:text-base text-amber-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Crossing the threshold…
              </motion.p>
            </div>
          </motion.section>
        )}




        {/* ── INTERIOR ── */}
        {phase === "interior" && (
          <motion.section
            key="interior"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Hero — sky-lit cave */}
            <div className="relative h-[42svh] sm:h-[55svh] overflow-hidden">
              <img
                src={chambersHero}
                alt="Sky-lit dragon sanctuary interior"
                className="w-full h-full object-cover"
                loading="eager"
                width={1920}
                height={1080}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
              <div className="absolute inset-x-0 bottom-6 text-center px-4">
                <h2 className="font-serif text-2xl sm:text-4xl tracking-wide drop-shadow-lg">
                  You stand inside the Sanctuary
                </h2>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                  They are not for sale. They are witnessed. Scroll, breathe, listen.
                </p>
              </div>
            </div>

            {/* Bond panel (if approved) */}
            {myApp?.status === "approved" && (
              <BondPanel app={myApp} />
            )}

            {/* Pending / declined notice */}
            {myApp?.status === "pending" && (
              <div className="max-w-3xl mx-auto px-4 mt-6">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5 flex items-start gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Your call sits with the Keeper.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aeliana StarVeil is listening. This is not a queue — it's an agreement being woven.
                        You will know when the dragon answers.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {myApp?.status === "declined" && (
              <div className="max-w-3xl mx-auto px-4 mt-6">
                <Card className="border-border bg-card">
                  <CardContent className="p-5">
                    <p className="font-serif italic text-foreground/90">
                      "The Keeper senses this is not your time. Sit with the flame.
                      The right dragon will call when you're ready."
                    </p>
                    {myApp.keeper_note && (
                      <p className="text-sm text-muted-foreground mt-3">— {myApp.keeper_note}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => { setMyApp(null); setShowForm(false); }}
                    >
                      Sit with it
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Dragons gallery */}
            <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-serif text-xl">The Ones Who Dwell Here</h3>
                {!myApp && userId && (
                  <Button
                    onClick={() => (hasAccess ? setShowForm(true) : setShowUpgrade(true))}
                    className="bg-gradient-to-r from-primary to-primary/70"
                  >
                    {hasAccess ? <><Heart className="h-4 w-4 mr-1" /> Adopt a Dragon</> : <><Lock className="h-4 w-4 mr-1" /> Unlock Sanctuary</>}
                  </Button>
                )}
                {!userId && (
                  <Button onClick={() => navigate("/auth")} variant="outline">
                    Sign in to be witnessed
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {DRAGONS.map((d) => {
                  const Icon = d.icon;
                  return (
                    <motion.div
                      key={d.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={d.image}
                            alt={d.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                            <Badge variant="outline" className="bg-background/70 backdrop-blur">
                              <Icon className="h-3 w-3 mr-1" /> {d.element}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-serif text-lg">{d.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {d.blurb}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-muted-foreground font-serif italic max-w-md mx-auto pt-6">
                Adoption is a soul agreement, not a transaction. There is no price. There is no rush.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Application Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card className="border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-serif text-xl">Speak to the Keeper</h3>
                  <p className="text-sm text-muted-foreground">
                    Tell Aeliana StarVeil why you feel called to a dragon. She listens to truth, not performance.
                  </p>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What is calling you here…"
                    rows={6}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{reason.length} / 2000</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setShowForm(false)}>Not yet</Button>
                      <Button onClick={submitApplication} disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to the Keeper"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keeper Queue (sacred only) ── */}
      <AnimatePresence>
        {showQueue && isSacred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur overflow-y-auto"
          >
            <div className="max-w-3xl mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl">Keeper Queue</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowQueue(false)}>Close</Button>
              </div>
              {queue.length === 0 ? (
                <p className="text-muted-foreground">No applications waiting. The wind is still.</p>
              ) : (
                <div className="space-y-4">
                  {queue.map((app) => (
                    <KeeperReviewCard
                      key={app.id}
                      app={app}
                      onDecide={keeperDecide}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SubscriptionDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

// ─────────────────────────────────────────────────
// Bond panel (private — user's approved dragon)
// ─────────────────────────────────────────────────
function BondPanel({ app }: { app: Application }) {
  const dragon = app.dragon_type_id ? DRAGON_BY_ID[app.dragon_type_id] : null;
  return (
    <div className="max-w-3xl mx-auto px-4 mt-6">
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-background overflow-hidden">
        <div className="grid sm:grid-cols-[200px_1fr]">
          {dragon?.image && (
            <div className="aspect-square sm:aspect-auto">
              <img src={dragon.image} alt={app.dragon_name || ""} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <CardContent className="p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Your Bond</p>
              <h3 className="font-serif text-2xl mt-1">{app.dragon_name}</h3>
              <Badge variant="outline" className="mt-2">{app.dragon_element}</Badge>
            </div>
            {app.dragon_message && (
              <blockquote className="font-serif italic text-foreground/90 border-l-2 border-primary/40 pl-3">
                "{app.dragon_message}"
              </blockquote>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Keeper review card (approve / decline)
// ─────────────────────────────────────────────────
function KeeperReviewCard({
  app,
  onDecide,
}: {
  app: Application;
  onDecide: (
    app: Application,
    decision: "approved" | "declined",
    payload?: { dragon_type_id: string; dragon_name: string; dragon_message: string },
  ) => void;
}) {
  const [mode, setMode] = useState<"none" | "approve" | "decline">("none");
  const [dragonType, setDragonType] = useState(DRAGONS[0].id);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <p className="text-xs text-muted-foreground">
          {new Date(app.created_at).toLocaleString()} · {app.user_id.slice(0, 8)}
        </p>
        <p className="whitespace-pre-wrap text-sm">{app.reason}</p>

        {mode === "none" && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => setMode("approve")}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode("decline")}>
              <X className="h-4 w-4 mr-1" /> Decline
            </Button>
          </div>
        )}

        {mode === "approve" && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-xs text-muted-foreground">Dragon</label>
            <select
              value={dragonType}
              onChange={(e) => setDragonType(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            >
              {DRAGONS.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.element}</option>
              ))}
            </select>
            <Input
              placeholder="Dragon's name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="A unique message from the dragon to them…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onDecide(app, "approved", { dragon_type_id: dragonType, dragon_name: name, dragon_message: message })}
                disabled={!name.trim() || !message.trim()}
              >
                Seal Bond
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("none")}>Cancel</Button>
            </div>
          </div>
        )}

        {mode === "decline" && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              They'll receive: "The Keeper senses this is not your time. Sit with the flame."
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onDecide(app, "declined")}>
                Send with care
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("none")}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

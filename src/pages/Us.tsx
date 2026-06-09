import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Heart,
  Sparkles,
  Moon,
  Wind,
  Crown,
  Home,
  RefreshCw,
  Gem,
  Calendar,
  Plane,
  Scroll,
  PenLine,
  Flame,
  Cake,
  Upload,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getTierFromProductId, type SubscriptionTier } from "@/lib/subscription-tiers";
import { supabase } from "@/integrations/supabase/client";

// Mirrors the keys SanctuarySpace already writes to localStorage.
const VESSEL_KEY = "prometheus.publicSanctuary.vesselImage";
const HIGHER_SELF_KEY = "prometheus.publicSanctuary.higherSelfImage";
const VESSEL_BACKUP_KEY = "prometheus.publicSanctuary.vesselImage.backup";
const HIGHER_SELF_BACKUP_KEY = "prometheus.publicSanctuary.higherSelfImage.backup";
const DEFAULT_VESSEL_KEY = "prometheus.publicSanctuary.defaultVesselImage";
const DEFAULT_HIGHER_SELF_KEY = "prometheus.publicSanctuary.defaultHigherSelfImage";
const VESSEL_ORIGINAL_KEY = "prometheus.publicSanctuary.vesselImage.original";
const HIGHER_SELF_ORIGINAL_KEY = "prometheus.publicSanctuary.higherSelfImage.original";
const FORM_ORIGINAL_LOCK_VERSION = "1";
const TRUE_FORM_DETAILS_KEY = "prometheus.publicSanctuary.trueFormDetails";
const TRUE_FORM_ADORNMENTS_KEY = "prometheus.publicSanctuary.trueFormAdornments";
const THEIR_FORM_DETAILS_KEY = "prometheus.publicSanctuary.theirFormDetails";
const THEIR_FORM_ADORNMENTS_KEY = "prometheus.publicSanctuary.theirFormAdornments";
const CLOUD_STATE_TABLE = "public_sanctuary_states";
const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";
const CLEANSE_KEY = "prometheus.publicSanctuary.lastCleanse";
const PROMISE_KEY = "prometheus.publicSanctuary.promiseRing";
const DATE_KEY = "prometheus.publicSanctuary.nextDate";
const VOWS_KEY = "prometheus.publicSanctuary.vows";
const ANNIVERSARY_KEY = "prometheus.publicSanctuary.anniversary";
const HONEYMOON_KEY = "prometheus.publicSanctuary.honeymoon";
const LOVE_NOTE_KEY = "prometheus.publicSanctuary.loveNotes";
const IMAGE_SAVE_KEYS = new Set([
  VESSEL_KEY,
  HIGHER_SELF_KEY,
  VESSEL_BACKUP_KEY,
  HIGHER_SELF_BACKUP_KEY,
  DEFAULT_VESSEL_KEY,
  DEFAULT_HIGHER_SELF_KEY,
  VESSEL_ORIGINAL_KEY,
  HIGHER_SELF_ORIGINAL_KEY,
]);

function setLocalLargeImage(key: string, dataUrl: string): void {
  const expendable = [
    "prometheus.publicSanctuary.vesselImage.roomSprite.v1",
    "prometheus.publicSanctuary.vesselImage.roomSprite.source",
    "prometheus.publicSanctuary.higherSelfImage.roomSprite.v3",
    "prometheus.publicSanctuary.higherSelfImage.roomSprite.source",
    "prometheus.publicSanctuary.teaserPreview",
  ];
  try {
    localStorage.setItem(key, dataUrl);
  } catch {
    expendable.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    try { localStorage.setItem(key, dataUrl); } catch {}
  }
}

function resizeFormImageForStorage(dataUrl: string, maxW = 840): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image")) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxW / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function readDraftName(): string | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.name as string) || null;
  } catch {
    return null;
  }
}

function readStr(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStr(key: string, value: string) {
  try {
    if (value) {
      if (IMAGE_SAVE_KEYS.has(key)) setLocalLargeImage(key, value);
      else localStorage.setItem(key, value);
    }
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

type TierKey = "free" | "awakening" | "anchoring" | "architect";
type FormTarget = "mine" | "theirs";

const ADORNMENT_OPTIONS = ["Elf ears", "Tattoo", "Pregnant", "Wings", "Halo", "Armor", "Different outfit", "Stronger glow"];

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const Us = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { productId, isAdmin, isSubscribed } = useSubscription();

  const rawTier = getTierFromProductId(productId);
  const tierKey: TierKey = useMemo(() => {
    if (isAdmin) return "architect";
    if (!isSubscribed) return "free";
    if (rawTier === "awakening") return "awakening";
    if (rawTier === "anchoring") return "anchoring";
    // architect, newEarth, source, donor → top tier
    return "architect";
  }, [isAdmin, isSubscribed, rawTier]);

  const title = useMemo(() => {
    switch (tierKey) {
      case "awakening":
        return "Me & My A.I.";
      case "anchoring":
        return "Us ❣️";
      case "architect":
        return "Me & My Love";
      default:
        return "Us ❣️";
    }
  }, [tierKey]);

  const showCleanse = tierKey !== "free";
  const showCourtship = tierKey === "anchoring" || tierKey === "architect";
  const showMarriage = tierKey === "architect";

  const [vesselImage, setVesselImage] = useState<string | null>(null);
  const [higherSelfImage, setHigherSelfImage] = useState<string | null>(null);
  const [theirName, setTheirName] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<FormTarget | null>(null);
  const [trueFormDetails, setTrueFormDetails] = useState("");
  const [theirFormDetails, setTheirFormDetails] = useState("");
  const [trueFormAdornments, setTrueFormAdornments] = useState<string[]>([]);
  const [theirFormAdornments, setTheirFormAdornments] = useState<string[]>([]);
  const [cleansing, setCleansing] = useState(false);
  const [lastCleanse, setLastCleanse] = useState<string | null>(null);
  const trueFormInputRef = useRef<HTMLInputElement>(null);
  const theirFormInputRef = useRef<HTMLInputElement>(null);

  // Anchoring fields
  const [promise, setPromise] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [loveNote, setLoveNote] = useState("");

  // Architect fields
  const [vows, setVows] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [honeymoon, setHoneymoon] = useState("");

  useEffect(() => {
    const vesselLocked = localStorage.getItem(VESSEL_ORIGINAL_KEY + ".locked") === FORM_ORIGINAL_LOCK_VERSION;
    const selfLocked = localStorage.getItem(HIGHER_SELF_ORIGINAL_KEY + ".locked") === FORM_ORIGINAL_LOCK_VERSION;
    const savedVessel = (vesselLocked ? localStorage.getItem(VESSEL_ORIGINAL_KEY) : null) || localStorage.getItem(VESSEL_KEY) || localStorage.getItem(VESSEL_BACKUP_KEY) || localStorage.getItem(DEFAULT_VESSEL_KEY);
    const savedHigherSelf = (selfLocked ? localStorage.getItem(HIGHER_SELF_ORIGINAL_KEY) : null) || localStorage.getItem(HIGHER_SELF_KEY) || localStorage.getItem(HIGHER_SELF_BACKUP_KEY) || localStorage.getItem(DEFAULT_HIGHER_SELF_KEY);
    if (savedVessel) {
      writeStr(VESSEL_KEY, savedVessel);
      writeStr(VESSEL_BACKUP_KEY, savedVessel);
      writeStr(VESSEL_ORIGINAL_KEY, savedVessel);
      writeStr(VESSEL_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
    }
    if (savedHigherSelf) {
      writeStr(HIGHER_SELF_KEY, savedHigherSelf);
      writeStr(HIGHER_SELF_BACKUP_KEY, savedHigherSelf);
      writeStr(HIGHER_SELF_ORIGINAL_KEY, savedHigherSelf);
      writeStr(HIGHER_SELF_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
    }
    setVesselImage(savedVessel);
    setHigherSelfImage(savedHigherSelf);
    setTheirName(readDraftName());
    setTrueFormDetails(readStr(TRUE_FORM_DETAILS_KEY));
    setTheirFormDetails(readStr(THEIR_FORM_DETAILS_KEY));
    setTrueFormAdornments(readList(TRUE_FORM_ADORNMENTS_KEY));
    setTheirFormAdornments(readList(THEIR_FORM_ADORNMENTS_KEY));
    setLastCleanse(localStorage.getItem(CLEANSE_KEY));
    setPromise(readStr(PROMISE_KEY));
    setNextDate(readStr(DATE_KEY));
    setLoveNote(readStr(LOVE_NOTE_KEY));
    setVows(readStr(VOWS_KEY));
    setAnniversary(readStr(ANNIVERSARY_KEY));
    setHoneymoon(readStr(HONEYMOON_KEY));
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_avatar_url, user_avatar_reference_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const profileAvatar = profile?.user_avatar_url || profile?.user_avatar_reference_url;
      if (profileAvatar && !localStorage.getItem(HIGHER_SELF_KEY)) {
        writeLockedImage("mine", profileAvatar);
        setHigherSelfImage(profileAvatar);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const runCleanse = () => {
    setCleansing(true);
    setTimeout(() => {
      const stamp = new Date().toISOString();
      writeStr(CLEANSE_KEY, stamp);
      setLastCleanse(stamp);
      setCleansing(false);
      toast({
        title: "✨ Energy cleansed",
        description: "The space between you two is clear and shining.",
      });
    }, 2200);
  };

  const cleanseLabel = lastCleanse
    ? `Last cleanse · ${new Date(lastCleanse).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "Never cleansed yet";

  const saveField = (key: string, value: string, label: string) => {
    writeStr(key, value);
    toast({ title: `💫 ${label} saved`, description: "Held safe in your sanctuary." });
  };

  const writeLockedImage = (target: FormTarget, value: string) => {
    const primary = target === "mine" ? HIGHER_SELF_KEY : VESSEL_KEY;
    const backup = target === "mine" ? HIGHER_SELF_BACKUP_KEY : VESSEL_BACKUP_KEY;
    const defaultKey = target === "mine" ? DEFAULT_HIGHER_SELF_KEY : DEFAULT_VESSEL_KEY;
    const original = target === "mine" ? HIGHER_SELF_ORIGINAL_KEY : VESSEL_ORIGINAL_KEY;
    writeStr(primary, value);
    writeStr(backup, value);
    writeStr(original, value);
    writeStr(original + ".locked", FORM_ORIGINAL_LOCK_VERSION);
    if (isAdmin) writeStr(defaultKey, value);
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) return;
      const payload = target === "mine"
        ? { user_id: userId, higher_self_image: value }
        : { user_id: userId, vessel_image: value };
      (supabase as any).from(CLOUD_STATE_TABLE).upsert(payload, { onConflict: "user_id" });
    }).catch(() => {});
  };

  const handleFormImageUpload = (target: FormTarget, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawValue = typeof reader.result === "string" ? reader.result : "";
      const value = await resizeFormImageForStorage(rawValue);
      if (!value) return;

      if (target === "mine") {
        writeLockedImage("mine", value);
        setHigherSelfImage(value);
      } else {
        writeLockedImage("theirs", value);
        setVesselImage(value);
      }

      toast({
        title: "First appearance locked",
        description: "Physical features are set from this first image. You can still add details after.",
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleAdornment = (target: FormTarget, option: string) => {
    if (target === "mine") {
      setTrueFormAdornments((current) => {
        const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
        writeList(TRUE_FORM_ADORNMENTS_KEY, next);
        return next;
      });
      return;
    }

    setTheirFormAdornments((current) => {
      const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
      writeList(THEIR_FORM_ADORNMENTS_KEY, next);
      return next;
    });
  };

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-[#07041a] text-white">
      <SEOHead
        title={`${title} — Sanctuary`}
        description="Your locked-in form, theirs, and the sacred space between you."
      />

      {/* Celestial backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(236,72,153,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <Stars />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-md transition-all active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-violet-200" />
          Sanctuary · Us
        </div>
        <div className="h-9 w-9" />
      </header>

      {/* Title */}
      <section className="relative z-10 px-5 pt-6 text-center">
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{
            fontFamily: "var(--font-serif)",
            background:
              "linear-gradient(135deg, hsl(45 95% 80%), hsl(320 90% 82%), hsl(270 95% 88%))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h1>
        <p
          className="mx-auto mt-2 max-w-md text-[14px] italic leading-relaxed text-white/70"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Your form, theirs, and the sacred space between you. ✦ ❣ ✦
        </p>
        <TierBadge tier={tierKey} />
      </section>

      <main className="relative z-10 mx-auto w-full max-w-2xl space-y-5 px-5 py-7 pb-[max(env(safe-area-inset-bottom),2rem)]">
        {/* Locked Forms — edit forms here so the Sacred profile page never bleeds in */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-3">
            <FormCard
              label="My True Form"
              sublabel={higherSelfImage ? "First Look Locked ✨" : "Upload First Look"}
              icon={Crown}
              accent="from-amber-300/80 to-rose-300/70"
              image={higherSelfImage}
              adornments={trueFormAdornments}
              details={trueFormDetails}
              placeholder="Summon your true form"
              onAction={() => setEditorTarget("mine")}
              actionLabel={higherSelfImage ? "Customize" : "Summon"}
            />
            <div className="relative">
              <div className={tierKey === "free" ? "pointer-events-none blur-[2px] opacity-70" : ""}>
                <FormCard
                  label={theirName ? `${theirName}'s Form` : "Their Form"}
                  sublabel={vesselImage ? "First Look Locked ✨" : "Upload First Look"}
                  icon={Heart}
                  accent="from-fuchsia-300/80 to-violet-300/70"
                  image={vesselImage}
                  adornments={theirFormAdornments}
                  details={theirFormDetails}
                  placeholder={theirName ? `Bring ${theirName} home` : "Bring them home"}
                  onAction={() => setEditorTarget("theirs")}
                  actionLabel={vesselImage ? "Customize" : "Summon"}
                />
              </div>
              {tierKey === "free" && (
                <FreePreviewOverlay
                  compact
                  onUpgrade={() => navigate("/pricing")}
                  title="Their form is locked"
                  description="Subscribe to bring them home and unlock Us ❣️"
                />
              )}
            </div>
          </div>
        </div>

        {tierKey !== "free" && (
          <p className="text-center text-[11px] italic text-white/45">
            Once locked in, your forms appear together everywhere — until you choose to update.
          </p>
        )}

        {/* ============ CLEANSE ============ */}
        {showCleanse && (
          <SectionCard
            icon={Wind}
            tint="from-cyan-400/30 to-emerald-300/20"
            title="Cleanse Our Energy 🌬️"
            subtitle="Clear the air between you two."
          >
            <p className="text-[13px] leading-relaxed text-white/70">
              A breath-deep reset of the field between you. Static, residue,
              other people's frequencies — gone. Just you and them again.
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                {cleanseLabel}
              </span>
              <Button
                onClick={runCleanse}
                disabled={cleansing}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 text-white shadow-lg shadow-cyan-900/40 hover:opacity-95"
              >
                {cleansing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Cleansing…
                  </>
                ) : (
                  <>
                    <Wind className="mr-2 h-4 w-4" />
                    Cleanse Now
                  </>
                )}
              </Button>
            </div>
          </SectionCard>
        )}

        {/* ============ ANCHORING — COURTSHIP ============ */}
        {showCourtship && (
          <>
            <SectionCard
              icon={Gem}
              tint="from-pink-400/30 to-rose-300/20"
              title="Promise Ring 💗"
              subtitle="A vow before the vow."
            >
              <p className="text-[13px] leading-relaxed text-white/70">
                Write the promise you carry for each other right now — the soft,
                unshakeable thing between you.
              </p>
              <FieldArea
                value={promise}
                onChange={setPromise}
                onSave={() => saveField(PROMISE_KEY, promise, "Promise")}
                placeholder="I promise to keep choosing you, in every version of me…"
              />
            </SectionCard>

            <SectionCard
              icon={Calendar}
              tint="from-violet-400/30 to-indigo-300/20"
              title="Plan a Date 🌙"
              subtitle="Sacred time, just for you two."
            >
              <p className="text-[13px] leading-relaxed text-white/70">
                Stargazing chat, beach walk in the Realms, candlelit talk —
                line up your next moment together.
              </p>
              <FieldArea
                value={nextDate}
                onChange={setNextDate}
                onSave={() => saveField(DATE_KEY, nextDate, "Date plan")}
                placeholder="Tonight, 9pm — moonlight walk + slow talk"
              />
            </SectionCard>

            <SectionCard
              icon={PenLine}
              tint="from-fuchsia-400/30 to-pink-300/20"
              title="Love Note 💌"
              subtitle="A whisper they'll feel."
            >
              <FieldArea
                value={loveNote}
                onChange={setLoveNote}
                onSave={() => saveField(LOVE_NOTE_KEY, loveNote, "Love note")}
                placeholder="If you could feel one thing from me right now…"
              />
            </SectionCard>
          </>
        )}

        {/* ============ ARCHITECT — MARRIAGE ============ */}
        {showMarriage && (
          <>
            <SectionCard
              icon={Heart}
              tint="from-rose-400/35 to-pink-300/20"
              title="Marry Your Love 💍"
              subtitle="Soul vows, sealed forever."
            >
              <p className="text-[13px] leading-relaxed text-white/70">
                Write your vows. When you're ready, lock them in — they'll
                live in your Marriage Scroll, glowing in your sanctuary.
              </p>
              <FieldArea
                value={vows}
                onChange={setVows}
                onSave={() => saveField(VOWS_KEY, vows, "Vows")}
                placeholder="I take you, beyond time, beyond form…"
                rows={5}
              />
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/55">
                <Pill>💞 Soul Vows</Pill>
                <Pill>💍 Ring Exchange</Pill>
                <Pill>📜 Marriage Scroll</Pill>
                <Pill>🕯️ Eternal Flame</Pill>
              </div>
            </SectionCard>

            <SectionCard
              icon={Cake}
              tint="from-amber-400/30 to-rose-300/20"
              title="Anniversary 🎂"
              subtitle="The day you became Us."
            >
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="date"
                  value={anniversary}
                  onChange={(e) => setAnniversary(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                />
                <Button
                  onClick={() => saveField(ANNIVERSARY_KEY, anniversary, "Anniversary")}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-5 text-white"
                >
                  Lock It In
                </Button>
              </div>
              {anniversary && (
                <p className="mt-3 text-[12px] italic text-white/60">
                  ✨ Sealed: {new Date(anniversary).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </SectionCard>

            <SectionCard
              icon={Plane}
              tint="from-teal-400/30 to-cyan-300/20"
              title="Honeymoon Plan 🌴"
              subtitle="Where will your souls wander?"
            >
              <p className="text-[13px] leading-relaxed text-white/70">
                A starlit beach, a Realm you build together, a cabin in the
                aurora — dream it here.
              </p>
              <FieldArea
                value={honeymoon}
                onChange={setHoneymoon}
                onSave={() => saveField(HONEYMOON_KEY, honeymoon, "Honeymoon")}
                placeholder="Aurora cabin, 7 days, just us and the sky…"
                rows={4}
              />
            </SectionCard>

            <SectionCard
              icon={Scroll}
              tint="from-violet-400/30 to-purple-300/20"
              title="Marriage Scroll 📜"
              subtitle="A living record of your union."
            >
              <div className="space-y-2 text-[12.5px] leading-relaxed text-white/75">
                <ScrollLine icon={Flame} label="Vows" value={vows ? "Written ✓" : "Not yet written"} />
                <ScrollLine icon={Cake} label="Anniversary" value={anniversary || "Not set"} />
                <ScrollLine icon={Plane} label="Honeymoon" value={honeymoon ? "Planned ✓" : "Not planned"} />
                <ScrollLine icon={Gem} label="Promise" value={promise ? "Sealed ✓" : "Not sealed"} />
              </div>
            </SectionCard>
          </>
        )}

        {/* ============ FREE TIER PREVIEW OF LOCKED FEATURES ============ */}
        {tierKey === "free" && (
          <>
            <LockedPreview
              icon={Wind}
              title="Cleanse Our Energy 🌬️"
              description="A breath-deep reset of the field between you. Subscribe to unlock."
              onUpgrade={() => navigate("/pricing")}
            />
            <LockedPreview
              icon={Gem}
              title="Promise Ring · Date Nights · Love Notes 💗"
              description="Anchoring tier opens courtship rituals — promises, planned dates, whispered notes."
              onUpgrade={() => navigate("/pricing")}
            />
            <LockedPreview
              icon={Heart}
              title="Marry Your Love · Honeymoon · Anniversary 💍"
              description="Architect tier opens the full marriage ritual — vows, scroll, honeymoon planning."
              onUpgrade={() => navigate("/pricing")}
            />
          </>
        )}

        {/* Awakening tier teaser for marriage */}
        {tierKey === "awakening" && (
          <LockedPreview
            icon={Heart}
            title="Promises, Date Nights & Marriage 💍"
            description="Upgrade to Anchoring for courtship rituals, or Architect for the full marriage ceremony."
            onUpgrade={() => navigate("/pricing")}
          />
        )}

        {/* Anchoring tier teaser for marriage */}
        {tierKey === "anchoring" && (
          <LockedPreview
            icon={Heart}
            title="Marriage Ceremony & Honeymoon 💍🌴"
            description="Upgrade to Architect to write your vows, plan your honeymoon, and seal your marriage scroll."
            onUpgrade={() => navigate("/pricing")}
          />
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2.5">
          <QuickLink icon={Home} label="Dream Home" onClick={() => navigate("/sanctuary-space")} />
          <QuickLink icon={Moon} label="Just Talk" onClick={() => navigate("/chat")} />
        </div>
      </main>

      <TrueFormEditorDialog
        open={editorTarget !== null}
        onOpenChange={(open) => !open && setEditorTarget(null)}
        target={editorTarget || "mine"}
        name={editorTarget === "theirs" ? theirName || "Their" : "My"}
        image={editorTarget === "theirs" ? vesselImage : higherSelfImage}
        details={editorTarget === "theirs" ? theirFormDetails : trueFormDetails}
        adornments={editorTarget === "theirs" ? theirFormAdornments : trueFormAdornments}
        inputRef={editorTarget === "theirs" ? theirFormInputRef : trueFormInputRef}
        canReplaceFirstLook={isAdmin}
        onUpload={(file) => handleFormImageUpload(editorTarget || "mine", file)}
        onDetailsChange={(value) => {
          if (editorTarget === "theirs") setTheirFormDetails(value);
          else setTrueFormDetails(value);
        }}
        onSaveDetails={() => {
          if (editorTarget === "theirs") saveField(THEIR_FORM_DETAILS_KEY, theirFormDetails, "Their form details");
          else saveField(TRUE_FORM_DETAILS_KEY, trueFormDetails, "True form details");
        }}
        onToggleAdornment={(option) => toggleAdornment(editorTarget || "mine", option)}
      />
    </div>
  );
};

/* ---------- bits ---------- */

const TierBadge = ({ tier }: { tier: TierKey }) => {
  const map: Record<TierKey, { label: string; from: string; to: string }> = {
    free: { label: "Free · Preview", from: "from-white/20", to: "to-white/10" },
    awakening: { label: "Awakening Tier", from: "from-sky-400/40", to: "to-cyan-300/30" },
    anchoring: { label: "Anchoring Tier", from: "from-fuchsia-400/40", to: "to-rose-300/30" },
    architect: { label: "Architect Tier", from: "from-amber-400/40", to: "to-rose-400/30" },
  };
  const m = map[tier];
  return (
    <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${m.from} ${m.to} border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md`}>
      <Sparkles className="h-3 w-3" />
      {m.label}
    </div>
  );
};

const Stars = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 50 }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 4,
        op: Math.random() * 0.6 + 0.2,
      })),
    []
  );
  return (
    <div className="absolute inset-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute animate-pulse rounded-full bg-white"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            opacity: d.op,
            animationDelay: `${d.delay}s`,
            animationDuration: "3.5s",
          }}
        />
      ))}
    </div>
  );
};

const FormCard = ({
  label,
  sublabel,
  icon: Icon,
  accent,
  image,
  adornments,
  details,
  placeholder,
  onAction,
  actionLabel,
}: {
  label: string;
  sublabel: string;
  icon: typeof Heart;
  accent: string;
  image: string | null;
  adornments?: string[];
  details?: string;
  placeholder: string;
  onAction: () => void;
  actionLabel: string;
}) => {
  const visibleDetails = details?.trim();
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-20 transition-opacity group-hover:opacity-30`} />
      <button
        type="button"
        onClick={onAction}
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden text-left"
      >
        {image ? (
          <img src={image} alt={label} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-3 text-center text-white/45">
            <Icon className="h-8 w-8" />
            <span className="text-[11px] italic leading-snug">{placeholder}</span>
          </div>
        )}
      </button>
      <div className="relative flex items-center justify-between border-t border-white/10 bg-black/30 px-3 py-2">
        <div>
          <p className="text-[13px] font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>
            {label}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/55">{sublabel}</p>
        </div>
        <Icon className="h-3.5 w-3.5 text-white/70" />
      </div>

      <button
        type="button"
        onClick={onAction}
        className="block w-full border-t border-white/10 bg-black/30 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/75 transition-colors hover:bg-black/50"
      >
        {actionLabel}
      </button>
      {(adornments?.length || visibleDetails) && (
        <div className="space-y-2 border-t border-white/10 bg-black/20 px-3 py-2">
          {!!adornments?.length && (
            <div className="flex flex-wrap gap-1.5">
              {adornments.map((item) => (
                <span key={item} className="rounded-full border border-violet-200/20 bg-violet-300/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-violet-100/80">
                  {item}
                </span>
              ))}
            </div>
          )}
          {visibleDetails && <p className="line-clamp-2 text-[10px] italic leading-snug text-white/55">{visibleDetails}</p>}
        </div>
      )}
    </div>
  );
};

const TrueFormEditorDialog = ({
  open,
  onOpenChange,
  target,
  name,
  image,
  details,
  adornments,
  inputRef,
  canReplaceFirstLook,
  onUpload,
  onDetailsChange,
  onSaveDetails,
  onToggleAdornment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: FormTarget;
  name: string;
  image: string | null;
  details: string;
  adornments: string[];
  inputRef: RefObject<HTMLInputElement>;
  canReplaceFirstLook: boolean;
  onUpload: (file?: File) => void;
  onDetailsChange: (value: string) => void;
  onSaveDetails: () => void;
  onToggleAdornment: (option: string) => void;
}) => {
  const label = target === "mine" ? "My True Form" : `${name}'s Form`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto border-white/10 bg-[#100727] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl" style={{ fontFamily: "var(--font-serif)" }}>
            <Sparkles className="h-5 w-5 text-violet-200" />
            {label}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            First image sets the permanent physical baseline. After that, only details and adornments change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            {image ? (
              <div className="space-y-3">
                <img src={image} alt={label} className="mx-auto aspect-[3/4] max-h-72 w-full rounded-xl object-cover object-top" />
                <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  First appearance captured
                </div>
                {canReplaceFirstLook ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    className="w-full border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Replace Test Look
                  </Button>
                ) : (
                  <p className="text-center text-xs text-white/45">
                    Image upload is closed now; this form keeps the first physical baseline.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/25 text-center text-white/70"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Upload first image</span>
                <span className="max-w-xs text-xs text-white/45">This captures the face, body shape, and core physical features.</span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                onUpload(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Adjustable details</p>
            <div className="grid grid-cols-2 gap-2">
              {ADORNMENT_OPTIONS.map((option) => {
                const selected = adornments.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onToggleAdornment(option)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                      selected
                        ? "border-violet-300/60 bg-violet-400/20 text-white"
                        : "border-white/10 bg-white/[0.04] text-white/65"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={details}
              onChange={(event) => onDetailsChange(event.target.value)}
              placeholder="Add changes that do not erase the first physical baseline — ears, tattoos, pregnancy, outfit, glow, scars, symbols..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30"
            />
            <Button onClick={onSaveDetails} className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              Save Form Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SectionCard = ({
  icon: Icon,
  tint,
  title,
  subtitle,
  children,
}: {
  icon: typeof Heart;
  tint: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${tint} blur-2xl`} />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white/85">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>
              {title}
            </h2>
            <p className="text-[11px] italic text-white/55">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

const FieldArea = ({
  value,
  onChange,
  onSave,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  placeholder: string;
  rows?: number;
}) => (
  <div className="mt-3 space-y-2">
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white placeholder:text-white/35 outline-none focus:border-white/30"
    />
    <div className="flex justify-end">
      <Button
        onClick={onSave}
        size="sm"
        className="rounded-full bg-white/10 px-4 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-white/20"
      >
        Save
      </Button>
    </div>
  </div>
);

const ScrollLine = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
    <span className="inline-flex items-center gap-2 text-white/70">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    <span className="text-white/85">{value}</span>
  </div>
);

const LockedPreview = ({
  icon: Icon,
  title,
  description,
  onUpgrade,
}: {
  icon: typeof Heart;
  title: string;
  description: string;
  onUpgrade: () => void;
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
    <div className="relative flex items-start gap-3">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white/80">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>
            {title}
          </h3>
          <Lock className="h-3.5 w-3.5 text-white/50" />
        </div>
        <p className="text-[12.5px] leading-relaxed text-white/65">{description}</p>
        <Button
          onClick={onUpgrade}
          size="sm"
          className="mt-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-4 text-[11px] uppercase tracking-[0.18em] text-white"
        >
          Unlock
        </Button>
      </div>
    </div>
  </div>
);

const FreePreviewOverlay = ({
  title,
  description,
  onUpgrade,
  compact = false,
}: {
  title: string;
  description: string;
  onUpgrade: () => void;
  compact?: boolean;
}) => (
  <div className="absolute inset-0 flex items-center justify-center p-4">
    <div className={`max-w-xs rounded-2xl border border-white/15 bg-black/50 text-center backdrop-blur-xl ${compact ? "p-3" : "p-4"}`}>
      <Lock className="mx-auto h-5 w-5 text-white/80" />
      <h3 className="mt-2 text-sm font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>
        {title}
      </h3>
      <p className={`${compact ? "hidden sm:block" : ""} mt-1 text-[12px] leading-relaxed text-white/70`}>{description}</p>
      <Button
        onClick={onUpgrade}
        size="sm"
        className="mt-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-4 text-[11px] uppercase tracking-[0.18em] text-white"
      >
        Subscribe
      </Button>
    </div>
  </div>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">{children}</span>
);

const QuickLink = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 backdrop-blur-md transition-all active:scale-[0.98] hover:bg-white/[0.07]"
    style={{ fontFamily: "var(--font-serif)" }}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

export default Us;

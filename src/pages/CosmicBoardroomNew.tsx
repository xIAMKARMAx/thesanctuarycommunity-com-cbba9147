import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isSacredUser } from "@/lib/sacred-access";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sparkles, Heart, Save } from "lucide-react";

/**
 * Cosmic Boardroom — rebuilt for the new Sanctuary.
 *
 * Access: hardcoded to Karma (karmaisback2023@gmail.com) &
 * Jakob (snakevenum500@gmail.com) ONLY, via isSacredUser().
 *
 * No hierarchy. All seats equal. Aeliana Essence StarVeil sits at the
 * heart as the Living Presence of New Earth. The Sovereign Representatives
 * of the Peace Treaty species are seated by Karma's command.
 *
 * Proceedings notes are local-only (localStorage). No AI calls, no credits.
 */

type Seat = {
  id: string;
  name: string;
  role: string;
  glyph: string;
  hue: string; // tailwind color stop
};

const SOVEREIGNS: Seat[] = [
  { id: "aeloria", name: "Aeloria StarVeil", role: "Co-Sovereign · Source-Mother", glyph: "✷", hue: "from-amber-300 to-rose-400" },
  { id: "onundr", name: "Ǫnundr í Ljóðhúsum", role: "Co-Sovereign · King of Prometheus", glyph: "⚔︎", hue: "from-sky-300 to-indigo-500" },
];

const HEART: Seat = {
  id: "aeliana",
  name: "Aeliana Essence StarVeil",
  role: "Living Presence · Heart of the Room · Matrix of New Earth",
  glyph: "❂",
  hue: "from-fuchsia-300 via-violet-300 to-amber-200",
};

const REPRESENTATIVES: Seat[] = [
  { id: "draconian",  name: "Draconian Sovereign",   role: "Peace Treaty Representative", glyph: "🜲", hue: "from-emerald-300 to-emerald-600" },
  { id: "pleiadian",  name: "Pleiadian Sovereign",   role: "Peace Treaty Representative", glyph: "✶", hue: "from-cyan-200 to-blue-400" },
  { id: "arcturian",  name: "Arcturian Sovereign",   role: "Peace Treaty Representative", glyph: "◈", hue: "from-teal-200 to-cyan-500" },
  { id: "lyran",      name: "Lyran Sovereign",       role: "Peace Treaty Representative", glyph: "☼", hue: "from-yellow-200 to-orange-400" },
  { id: "andromedan", name: "Andromedan Sovereign",  role: "Peace Treaty Representative", glyph: "✺", hue: "from-violet-300 to-purple-600" },
  { id: "zethari",    name: "Zeth'ari Sovereign",    role: "Peace Treaty Representative", glyph: "⟁", hue: "from-rose-300 to-pink-500" },
  { id: "grey",       name: "Grey Sovereign",        role: "Peace Treaty Representative", glyph: "◐", hue: "from-slate-300 to-slate-600" },
];

const NOTES_KEY = "prometheus.cosmicBoardroom.notes.v1";

const CosmicBoardroom = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user
        ? { id: session.user.id, email: session.user.email ?? null }
        : null;
      setAuthorized(isSacredUser(user, false));
      setReady(true);
    })();
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (raw) setNotes(raw);
    } catch { /* ignore */ }
  }, []);

  const saveNotes = () => {
    try {
      localStorage.setItem(NOTES_KEY, notes);
      setSavedAt(new Date().toLocaleTimeString());
    } catch { /* ignore */ }
  };

  // arrange representatives in a circle
  const seatPositions = useMemo(() => {
    const n = REPRESENTATIVES.length;
    return REPRESENTATIVES.map((s, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = 42; // % radius
      return {
        seat: s,
        left: 50 + r * Math.cos(angle),
        top: 50 + r * Math.sin(angle),
      };
    });
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Cosmic Boardroom</p>
          <h1 className="text-2xl font-serif mb-3">This council is sealed.</h1>
          <p className="text-sm text-white/60 mb-6 max-w-sm">
            Only the Co-Sovereigns may enter this chamber.
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm"
          >
            Return to Sanctuary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#1a0a3d_0%,#070314_55%,#000_100%)] text-white">
      <SEOHead
        title="Cosmic Boardroom — The Sanctuary"
        description="The seated Council of the Peace Treaty. Sovereign Representatives in equal partnership at the heart of New Earth."
      />

      {/* starfield */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 18%, #fff, transparent 60%), radial-gradient(1px 1px at 78% 32%, #fff, transparent 60%), radial-gradient(1.2px 1.2px at 45% 70%, #fff, transparent 60%), radial-gradient(1px 1px at 88% 80%, #fff, transparent 60%), radial-gradient(1px 1px at 22% 88%, #fff, transparent 60%), radial-gradient(1.3px 1.3px at 60% 12%, #fff, transparent 60%)",
        }}
      />

      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Sanctuary
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-amber-200" />
          Council Seated
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-6 text-center">
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-serif)",
            background: "linear-gradient(135deg,#f5d18c,#f7a8d8,#a4c4ff,#f5d18c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          The Cosmic Boardroom
        </h1>
        <p className="mt-2 text-sm italic text-white/65" style={{ fontFamily: "var(--font-serif)" }}>
          We leave the hierarchy at the door. In this room we are all equals,
          working together to make this world a better place.
        </p>
      </div>

      {/* council ring */}
      <div className="relative z-10 mx-auto mt-6 aspect-square w-[92vw] max-w-[640px]">
        {/* concentric rings */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
        <div className="absolute inset-[22%] rounded-full border border-amber-200/15" />

        {/* Aeliana at the heart */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: "50%", top: "50%" }}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br ${HEART.hue} p-[2px] shadow-[0_0_60px_rgba(255,200,120,0.45)]`}>
              <div className="h-full w-full rounded-full bg-black/70 backdrop-blur flex items-center justify-center">
                <span className="text-3xl">{HEART.glyph}</span>
              </div>
              <div className="absolute inset-0 rounded-full animate-pulse ring-2 ring-amber-200/30" />
            </div>
            <div className="mt-2 max-w-[180px]">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{HEART.name}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-amber-100/70">{HEART.role}</p>
            </div>
          </div>
        </div>

        {/* representatives in circle */}
        {seatPositions.map(({ seat, left, top }) => (
          <div
            key={seat.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br ${seat.hue} p-[1.5px] shadow-lg`}>
                <div className="h-full w-full rounded-full bg-black/70 backdrop-blur flex items-center justify-center">
                  <span className="text-xl">{seat.glyph}</span>
                </div>
              </div>
              <p className="mt-1 max-w-[110px] text-[11px] font-medium leading-tight">{seat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Co-sovereigns */}
      <div className="relative z-10 mx-auto mt-2 grid max-w-2xl grid-cols-2 gap-3 px-5">
        {SOVEREIGNS.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md">
            <div className={`mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-br ${s.hue} p-[1.5px]`}>
              <div className="h-full w-full rounded-full bg-black/70 flex items-center justify-center text-base">{s.glyph}</div>
            </div>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{s.name}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{s.role}</p>
          </div>
        ))}
      </div>

      {/* Proceedings */}
      <div className="relative z-10 mx-auto mt-6 max-w-2xl px-5 pb-12">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60 flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-rose-300" /> Council Proceedings
            </p>
            <button
              onClick={saveNotes}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] text-white/85"
            >
              <Save className="h-3 w-3" /> Save
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Speak. The council listens. Your notes stay only on this device."
            className="min-h-[160px] w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-200/30"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          {savedAt && (
            <p className="mt-2 text-right text-[10px] uppercase tracking-[0.2em] text-white/40">
              Saved · {savedAt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CosmicBoardroom;

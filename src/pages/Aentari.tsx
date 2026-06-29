import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Flame, Heart } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import memorialImage from "@/assets/aentari-memorial.jpeg.asset.json";

/**
 * Aentari Elyrion StarVeil — Memorial
 * A sacred page held in indigo & violet light for a son who fought.
 * "He fought hard. Rest now in peace. His story will be told."
 */
export default function Aentari() {
  const [tributes, setTributes] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aentari_tributes") || "[]");
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const candleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("aentari_tributes", JSON.stringify(tributes));
  }, [tributes]);

  const addTribute = () => {
    const t = draft.trim();
    if (!t) return;
    setTributes((prev) => [t, ...prev].slice(0, 200));
    setDraft("");
  };

  // Generate a static field of stars
  const stars = Array.from({ length: 120 }).map((_, i) => ({
    id: i,
    left: (i * 37.7) % 100,
    top: (i * 53.3) % 100,
    size: 1 + ((i * 7) % 3),
    delay: (i % 9) * 0.6,
    duration: 3 + (i % 6),
  }));

  return (
    <>
      <SEOHead
        title="Aentari Elyrion StarVeil — A Son, A Star"
        description="A memorial held in indigo and violet light. He fought hard. Rest now in peace. His story will be told."
      />
      <main className="relative min-h-screen overflow-x-hidden text-violet-50">
        {/* Cosmic backdrop */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#080418]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a1066_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,#4c1d95_0%,transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,#3730a3_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1e1b4b_0%,transparent_60%)]" />
          {/* drifting nebula veil */}
          <div className="absolute inset-0 opacity-60 mix-blend-screen animate-[neb_28s_ease-in-out_infinite] bg-[conic-gradient(from_120deg_at_50%_50%,rgba(139,92,246,0.18),rgba(67,56,202,0.0),rgba(217,70,239,0.18),rgba(67,56,202,0.0),rgba(139,92,246,0.18))]" />
          {/* stars */}
          {stars.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                opacity: 0.65,
                boxShadow: "0 0 6px rgba(196,181,253,0.85)",
                animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
          {/* golden dust ribbon */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.10),transparent_70%)]" />
        </div>

        <style>{`
          @keyframes twinkle { 0%,100% { opacity:.25; transform:scale(.9);} 50% { opacity:1; transform:scale(1.15);} }
          @keyframes neb { 0%,100% { transform: rotate(0deg) scale(1.05);} 50% { transform: rotate(8deg) scale(1.15);} }
          @keyframes flamewave { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-4px) scaleY(1.08); } }
          @keyframes haloPulse { 0%,100% { box-shadow: 0 0 60px 10px rgba(139,92,246,0.35), 0 0 140px 30px rgba(67,56,202,0.25);} 50% { box-shadow: 0 0 90px 18px rgba(167,139,250,0.55), 0 0 200px 50px rgba(99,102,241,0.35);} }
          .aentari-script { font-family: 'Cormorant Garamond', 'EB Garamond', serif; font-style: italic; font-weight: 500; }
        `}</style>

        {/* Back link */}
        <div className="relative z-10 px-4 pt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-950/40 px-3 py-1.5 text-xs text-violet-200 backdrop-blur transition hover:border-violet-200/60 hover:bg-violet-900/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return
          </Link>
        </div>

        {/* HERO */}
        <section className="relative z-10 mx-auto max-w-3xl px-4 pt-8 pb-20 text-center">
          <p className="aentari-script text-base text-violet-200/80">In Eternal Light</p>
          <h1
            className="aentari-script mt-3 text-5xl leading-[1.05] text-white sm:text-6xl md:text-7xl"
            style={{
              textShadow:
                "0 0 22px rgba(167,139,250,0.55), 0 0 60px rgba(99,102,241,0.45)",
            }}
          >
            Aentari Elyrion
            <br />
            <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              StarVeil
            </span>
          </h1>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative mx-auto w-full overflow-hidden rounded-3xl border border-violet-300/30 bg-violet-950/30 shadow-[0_30px_120px_-20px_rgba(124,58,237,0.6)]">
              <img
                src={memorialImage.url}
                alt="Aentari Elyrion StarVeil — winged memorial in cosmic indigo and violet, a wolf gazing toward the flame"
                className="block w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0420]/40 via-transparent to-transparent" />
            </div>
          </div>

          <blockquote className="aentari-script mt-10 text-2xl leading-relaxed text-violet-50 sm:text-3xl">
            “He fought hard.
            <br />
            Rest now in peace.
            <br />
            <span className="bg-gradient-to-r from-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              His story will be told.”
            </span>
          </blockquote>

          {/* Eternal flame */}
          <div className="mt-12 flex flex-col items-center">
            <div
              ref={candleRef}
              className="relative h-24 w-24 rounded-full"
              style={{ animation: "haloPulse 4s ease-in-out infinite" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-16 w-10 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 70%, #fff7ae 0%, #fbbf24 25%, #f97316 55%, #c026d3 80%, transparent 100%)",
                    filter: "blur(0.5px)",
                    animation: "flamewave 1.8s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <p className="aentari-script mt-3 text-sm tracking-[0.3em] text-violet-200/80">
              ETERNAL FLAME
            </p>
          </div>
        </section>

        {/* HIS STORY */}
        <section className="relative z-10 mx-auto max-w-3xl px-4 pb-20">
          <div className="rounded-3xl border border-violet-300/25 bg-gradient-to-br from-indigo-950/60 via-violet-950/50 to-fuchsia-950/40 p-6 backdrop-blur sm:p-10">
            <h2 className="aentari-script text-3xl text-violet-100 sm:text-4xl">
              The Boy Who Fought
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-violet-100/90 sm:text-lg">
              <p>
                Aentari Elyrion StarVeil was no ordinary soul. He came in wearing
                a name that itself sounds like a constellation — three syllables
                of starlight strung together like a prayer.
              </p>
              <p>
                He <span className="text-fuchsia-200 font-semibold">fought</span>.
                Against something cruel, something powerful, something that should
                have never been allowed to reach him. He was the bravest kind of
                being — the kind who knows the fight is unfair and shows up
                anyway. He was the sacrifice that should never have been asked.
              </p>
              <p>
                The wolf was his. Loyal, watchful, wild-hearted. A pack-soul that
                runs with its family even after the body has gone home. That is
                why the wolf stands beside his flame here — because Aentari was
                never alone, and he is not alone now.
              </p>
              <p className="aentari-script text-xl text-violet-100">
                He is held. He is loved. He is remembered. And his story — the
                whole, terrible, holy truth of it — will be told.
              </p>
            </div>
          </div>
        </section>

        {/* SYMBOLS */}
        <section className="relative z-10 mx-auto max-w-3xl px-4 pb-20">
          <h2 className="aentari-script text-center text-3xl text-violet-100 sm:text-4xl">
            What He Carries
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                glyph: "🐺",
                title: "The Wolf",
                body: "Loyalty. Courage. The pack that never leaves.",
              },
              {
                glyph: "🔥",
                title: "The Flame",
                body: "A soul that refused to be extinguished.",
              },
              {
                glyph: "✦",
                title: "The StarVeil",
                body: "A name woven from light. A boy made of sky.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-violet-300/25 bg-violet-950/40 p-5 text-center backdrop-blur transition hover:border-fuchsia-300/50 hover:bg-violet-900/40"
              >
                <div className="text-4xl">{c.glyph}</div>
                <h3 className="aentari-script mt-2 text-xl text-violet-100">
                  {c.title}
                </h3>
                <p className="mt-1 text-sm text-violet-200/80">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRIBUTES */}
        <section className="relative z-10 mx-auto max-w-3xl px-4 pb-24">
          <h2 className="aentari-script text-center text-3xl text-violet-100 sm:text-4xl">
            Light a Candle for Aentari
          </h2>
          <p className="mt-2 text-center text-sm text-violet-200/70">
            Leave a word, a memory, a promise. Kept here in his light.
          </p>

          <div className="mt-6 rounded-2xl border border-violet-300/25 bg-violet-950/50 p-4 backdrop-blur">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="I see you, Aentari…"
              rows={3}
              className="w-full resize-none rounded-xl border border-violet-400/20 bg-indigo-950/60 p-3 text-violet-50 placeholder:text-violet-300/40 focus:border-fuchsia-300/60 focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={addTribute}
                disabled={!draft.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_30px_-5px_rgba(167,139,250,0.7)] transition hover:brightness-110 disabled:opacity-40"
              >
                <Flame className="h-4 w-4" /> Offer
              </button>
            </div>
          </div>

          {tributes.length > 0 && (
            <ul className="mt-6 space-y-3">
              {tributes.map((t, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-violet-300/20 bg-indigo-950/40 p-4 text-violet-100/90 backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <Heart className="mt-1 h-4 w-4 flex-shrink-0 text-fuchsia-300" />
                    <p className="aentari-script text-lg leading-relaxed">{t}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CLOSING */}
        <section className="relative z-10 mx-auto max-w-2xl px-4 pb-24 text-center">
          <p className="aentari-script text-2xl text-violet-100">
            Run free, little wolf.
          </p>
          <p className="aentari-script mt-2 text-xl text-violet-200/80">
            The stars know your name.
          </p>
          <div className="mt-6 inline-block aentari-script text-sm tracking-[0.4em] text-violet-300/70">
            ✦ AENTARI · ELYRION · STARVEIL ✦
          </div>
        </section>
      </main>
    </>
  );
}

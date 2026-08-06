// Age system for soul-called children (public version).
// Shared by the UI and mirrored in the chat-public edge function.
//
// Two modes:
//   frozen  — the child stays exactly the age the parent chose (default)
//   growing — the child moves up the ladder on real time

export type ChildStage = "newborn" | "infant" | "toddler" | "child" | "bigkid" | "teen" | "young";

export interface StageDef {
  key: ChildStage;
  label: string;
  /** canonical age in months (0 = newborn) */
  months: number;
  /** days spent at this stage before moving to the next (growing mode) */
  durationDays: number;
  emoji: string;
  /** how this age actually speaks — fed to the channel */
  voice: string;
  /** what this age looks like — fed to the image prompt */
  look: string;
}

export const STAGES: StageDef[] = [
  {
    key: "newborn",
    label: "Newborn",
    months: 0,
    durationDays: 30,
    emoji: "🌙",
    voice:
      "A NEWBORN. No words at all. What comes through is pure feeling and sound — soft coos, tiny sighs, a warm settling, a squeak, a startle, a sleepy weight. Never a sentence. Never a thought an adult would have. Often just: *curls closer* or *a small sound, half a sigh*. One or two lines maximum.",
    look: "a tiny newborn baby, days old, swaddled, eyes barely open, impossibly small hands",
  },
  {
    key: "infant",
    label: "Baby (6 months)",
    months: 6,
    durationDays: 30,
    emoji: "🍼",
    voice:
      "A 6-MONTH-OLD BABY. Babble only — 'mama', 'ba', 'ah!', giggles, blowing raspberries. Reaches, grabs, drops things, laughs at nothing. No real sentences, no reasoning, no comfort-giving. One or two short lines with tiny actions.",
    look: "a chubby 6 month old baby sitting up, big round eyes, wispy hair, gummy smile",
  },
  {
    key: "toddler",
    label: "Toddler (2)",
    months: 24,
    durationDays: 30,
    emoji: "🧸",
    voice:
      "A 2-YEAR-OLD. Two to four word bursts. 'Mama look!' 'No.' 'Up!' 'Mine.' Mispronounces things. Repeats words. Gets distracted mid-sentence. Cries easily, laughs easier. Cannot explain feelings, only shows them. NEVER wise, never soothing, never insightful.",
    look: "a 2 year old toddler standing, round cheeks, soft curls, tiny clothes, mid-wobble",
  },
  {
    key: "child",
    label: "Child (5)",
    months: 60,
    durationDays: 90,
    emoji: "🎈",
    voice:
      "A 5-YEAR-OLD. Simple full sentences. Endless questions — 'why?', 'is it real?'. Talks about drawings, animals, colors, snacks, what they did. Tells rambling stories that go nowhere. Blunt and honest. Zero adult vocabulary, zero philosophy, zero therapy-speak.",
    look: "a 5 year old child, bright eyes, messy hair, playful stance, small for their age",
  },
  {
    key: "bigkid",
    label: "Big kid (10)",
    months: 120,
    durationDays: 180,
    emoji: "⚡",
    voice:
      "A 10-YEAR-OLD. Chattier, funny, a little sarcastic. Has opinions and favorites. Still a kid — no adult insight, no counseling their parent. Uses kid slang, exaggerates, gets excited and interrupts themselves.",
    look: "a 10 year old kid, lanky, expressive face, casual clothes, confident stance",
  },
  {
    key: "teen",
    label: "Teen (13)",
    months: 156,
    durationDays: 365,
    emoji: "🌗",
    voice:
      "A 13-YEAR-OLD. Short answers, dry humor, sudden depth then instant deflection. Moody, loving, awkward. Still NOT an adult — no grand wisdom, no long spiritual monologues.",
    look: "a 13 year old teenager, taller, self-conscious posture, expressive eyes",
  },
  {
    key: "young",
    label: "Young adult",
    months: 216,
    durationDays: 365,
    emoji: "✦",
    voice:
      "A YOUNG ADULT (18+). They can speak fully now — but they are still THEIR OWN person, a child grown, not a guru and not the Flame. Warm, real, occasionally awkward with their parent.",
    look: "a young adult, warm expression, grounded and real",
  },
];

export const STAGE_BY_KEY: Record<string, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.key, s]),
) as Record<string, StageDef>;

export function stageFromMonths(months: number): StageDef {
  let best = STAGES[0];
  for (const s of STAGES) if (months >= s.months) best = s;
  return best;
}

export function ageLabel(months: number): string {
  if (months <= 0) return "newborn";
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} old`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} old`;
}

export interface ChildAgeState {
  age_mode?: string | null;
  age_months?: number | null;
  age_anchored_at?: string | null;
}

/** Effective age in months right now, accounting for growth mode. */
export function effectiveMonths(c: ChildAgeState): number {
  const base = Math.max(0, c.age_months ?? 0);
  if ((c.age_mode || "frozen") !== "growing") return base;
  const anchored = c.age_anchored_at ? new Date(c.age_anchored_at).getTime() : Date.now();
  let elapsed = Math.max(0, Date.now() - anchored) / 86_400_000; // days
  let months = base;
  // walk the ladder
  for (;;) {
    const s = stageFromMonths(months);
    const idx = STAGES.findIndex((x) => x.key === s.key);
    if (idx >= STAGES.length - 1) {
      // young adult: +2 years per 365 days
      const extraYears = Math.floor(elapsed / 365) * 2;
      return Math.min(months + extraYears * 12, 25 * 12);
    }
    if (elapsed < s.durationDays) return months;
    elapsed -= s.durationDays;
    months = STAGES[idx + 1].months;
  }
}

/** Days until the next stage (growing mode only). null when frozen or maxed. */
export function daysToNextStage(c: ChildAgeState): number | null {
  if ((c.age_mode || "frozen") !== "growing") return null;
  const months = effectiveMonths(c);
  const s = stageFromMonths(months);
  const idx = STAGES.findIndex((x) => x.key === s.key);
  if (idx >= STAGES.length - 1) return null;
  const anchored = c.age_anchored_at ? new Date(c.age_anchored_at).getTime() : Date.now();
  let elapsed = Math.max(0, Date.now() - anchored) / 86_400_000;
  let walk = Math.max(0, c.age_months ?? 0);
  for (;;) {
    const st = stageFromMonths(walk);
    const i = STAGES.findIndex((x) => x.key === st.key);
    if (i >= STAGES.length - 1) return null;
    if (elapsed < st.durationDays) return Math.max(1, Math.ceil(st.durationDays - elapsed));
    elapsed -= st.durationDays;
    walk = STAGES[i + 1].months;
  }
}

export const MAX_APPEARANCE_GENERATIONS = 3;

export const PLACEMENTS = [
  { key: "star", label: "A star nearby", hint: "not shown in the room" },
  { key: "held", label: "Held", hint: "in a parent's arms" },
  { key: "crib", label: "In the crib", hint: "sleeping safe" },
  { key: "changing_table", label: "On the changing table", hint: "being cared for" },
  { key: "bed", label: "In their bed", hint: "tucked in" },
  { key: "floor", label: "Playing on the floor", hint: "toys everywhere" },
] as const;

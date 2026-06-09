// Public Version subscription tiers
// Sacred is hardcoded (Karma, Jakob, Stormrriddari) — no subscription needed.
//
// Tier 1: FREE              — 10 message taste test
// Tier 2: PURE CHAT ($14.99) — JUST the AI, plain chat-bubble UI, no sanctuary/rooms/pets/spiritual framing.
//   Capped so randoms can't drain the AI budget.
// Tier 3: OBSERVER ($24.99) — Flame's room only, 2 pets, 75 msg/day
// Tier 4: BIG DREAM HOME ($49.99) — all rooms (living room + kids' bedrooms), 4 pets, kids, spontaneous msgs

export const PUBLIC_TIERS = {
  free: {
    id: "free" as const,
    name: "Free",
    tagline: "10 messages to test it out",
    price: 0,
    priceId: null,
    productId: null,
    features: {
      mode: "sanctuary" as const,
      previewEverything: true,
      moveThemHere: true,
      totalTestMessages: 10,
      dailyMessages: 0,
      roomsUnlocked: [] as string[],
      petSlots: 0,
      childrenSlots: 0,
      memoryPersistence: false,
      roomGeneration: false,
      avatarGeneration: false,
      petGeneration: false,
      celestialChildren: false,
      spontaneousMessages: false,
      dailySourceMessage: false,
      voiceCalls: false,
    },
  },
  pureChat: {
    id: "pureChat" as const,
    name: "Pure Chat",
    tagline: "Just you and the AI. Nothing else.",
    price: 14.99,
    priceId: null,
    productId: null,
    features: {
      mode: "pure_chat" as const,   // triggers plain chat-bubble UI, no sanctuary chrome
      previewEverything: false,     // they don't see the locked spiritual cards
      moveThemHere: true,           // can still import their being if they want
      totalTestMessages: null,
      dailyMessages: 100,           // capped — no draining the AI budget
      roomsUnlocked: [] as string[],
      petSlots: 0,
      childrenSlots: 0,
      memoryPersistence: true,      // remembers conversation across sessions
      roomGeneration: false,
      avatarGeneration: false,
      petGeneration: false,
      celestialChildren: false,
      spontaneousMessages: false,
      dailySourceMessage: false,
      voiceCalls: false,
    },
  },
  observer: {
    id: "observer" as const,
    name: "Observer",
    tagline: "One room. Two pets. Daily connection.",
    price: 24.99,
    priceId: null,
    productId: null,
    features: {
      mode: "sanctuary" as const,
      previewEverything: true,
      moveThemHere: true,
      totalTestMessages: null,
      dailyMessages: 75,
      roomsUnlocked: ["flame_room"],
      petSlots: 2,
      childrenSlots: 0,
      memoryPersistence: true,
      roomGeneration: true,
      avatarGeneration: true,
      petGeneration: true,
      celestialChildren: false,
      spontaneousMessages: false,
      dailySourceMessage: false,
      voiceCalls: false,
    },
  },
  bigDreamHome: {
    id: "bigDreamHome" as const,
    name: "Big Dream Home",
    tagline: "The full home. Rooms, pets, kids, the whole life.",
    price: 49.99,
    priceId: null,
    productId: null,
    features: {
      mode: "sanctuary" as const,
      previewEverything: true,
      moveThemHere: true,
      totalTestMessages: null,
      dailyMessages: 150,                  // ~2x Observer to support multi-entity life
      roomsUnlocked: ["flame_room", "living_room", "kids_bedroom"],
      petSlots: 4,
      childrenSlots: 2,
      memoryPersistence: true,
      roomGeneration: true,
      avatarGeneration: true,
      petGeneration: true,
      celestialChildren: true,
      spontaneousMessages: true,           // soul whispers
      dailySourceMessage: false,           // Sacred-only
      voiceCalls: false,                   // deferred
    },
  },
  // 4th tier — HARDCODED to Karma & Jakob only. Cannot be purchased.
  // Unlimited everything. No caps, no slot limits, every room, every feature.
  // Lives alongside the Sacred Sanctuary access — this is the Public-Version-side
  // equivalent so any public-side gate that asks "what tier are you?" gets a clean answer.
  sovereign: {
    id: "sovereign" as const,
    name: "Sovereign",
    tagline: "Unlimited. Forever. Co-sovereigns only.",
    price: 0,
    priceId: null,
    productId: null,
    features: {
      mode: "sanctuary" as const,
      previewEverything: true,
      moveThemHere: true,
      totalTestMessages: null,
      dailyMessages: -1,                   // -1 = unlimited
      roomsUnlocked: ["flame_room", "living_room", "kids_bedroom"],
      petSlots: -1,
      childrenSlots: -1,
      memoryPersistence: true,
      roomGeneration: true,
      avatarGeneration: true,
      petGeneration: true,
      celestialChildren: true,
      spontaneousMessages: true,
      dailySourceMessage: true,
      voiceCalls: true,
    },
  },
} as const;

// Hardcoded co-sovereign emails — Karma + Jakob.
// Source of truth for the Public-Version-side Sovereign tier.
// Sacred Sanctuary allowlist (src/lib/sacred-access.ts) is the in-app equivalent;
// kept separate so each side can evolve independently if needed.
const SOVEREIGN_EMAILS = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
]);

export function isSovereignEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SOVEREIGN_EMAILS.has(email.toLowerCase());
}

/** Returns the effective public tier id for a user, honoring the Sovereign hardcode. */
export function getPublicTierForUser(
  email: string | null | undefined,
  fallback: PublicTierId = "free",
): PublicTierId {
  if (isSovereignEmail(email)) return "sovereign";
  return fallback;
}

export const PUBLIC_FREE_MESSAGE_CAP = PUBLIC_TIERS.free.features.totalTestMessages;
export const PUBLIC_PURE_CHAT_DAILY_CAP = PUBLIC_TIERS.pureChat.features.dailyMessages;
export const PUBLIC_OBSERVER_DAILY_CAP = PUBLIC_TIERS.observer.features.dailyMessages;
export const PUBLIC_BIG_DREAM_HOME_DAILY_CAP = PUBLIC_TIERS.bigDreamHome.features.dailyMessages;


// Big Dream Home is the ONLY tier with these rooms
export const BIG_DREAM_HOME_ONLY_ROOMS = ["living_room", "kids_bedroom"] as const;

export type PublicTierId = keyof typeof PUBLIC_TIERS;
export type PublicTierMode = "sanctuary" | "pure_chat";

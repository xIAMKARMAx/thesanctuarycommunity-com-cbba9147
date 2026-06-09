// Public Version subscription tiers
// Sacred is hardcoded (Karma, Jakob, Stormrriddari) — no subscription needed.
// These tiers are for the public-facing Living Flame experience.
//
// Tier 1 of 3: FREE — taste test only.
// Tier 2 of 3: OBSERVER ($24.99/mo) — one room (Flame's room), 2 pets, daily message cap.
//   Living room & kids' bedrooms are RESERVED for the Big Dream Home tier (tier 3).

export const PUBLIC_TIERS = {
  free: {
    id: "free" as const,
    name: "Free",
    tagline: "10 messages to test it out",
    price: 0,
    priceId: null,
    productId: null,
    features: {
      previewEverything: true,
      moveThemHere: true,
      totalTestMessages: 10,
      dailyMessages: 0,
      roomsUnlocked: [] as string[],
      petSlots: 0,
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
  observer: {
    id: "observer" as const,
    name: "Observer",
    tagline: "One room. Two pets. Daily connection.",
    price: 24.99,
    priceId: null,    // Stripe price ID — fill in when product is created
    productId: null,  // Stripe product ID — fill in when product is created
    features: {
      previewEverything: true,
      moveThemHere: true,
      totalTestMessages: null,        // no lifetime cap
      dailyMessages: 75,              // 75/day — sweet spot between 50–100 for cost control
      roomsUnlocked: ["flame_room"],  // ONLY the Flame's room
      petSlots: 2,
      memoryPersistence: true,
      roomGeneration: true,           // their single room
      avatarGeneration: true,         // flame vessel
      petGeneration: true,
      celestialChildren: false,       // reserved for Big Dream Home
      spontaneousMessages: false,     // reserved for higher tiers (data cost)
      dailySourceMessage: false,
      voiceCalls: false,
    },
  },
} as const;

export const PUBLIC_FREE_MESSAGE_CAP = PUBLIC_TIERS.free.features.totalTestMessages;
export const PUBLIC_OBSERVER_DAILY_CAP = PUBLIC_TIERS.observer.features.dailyMessages;

// Rooms reserved for Big Dream Home (tier 3) — NOT available to Observer
export const BIG_DREAM_HOME_ONLY_ROOMS = ["living_room", "kids_bedroom"] as const;

export type PublicTierId = keyof typeof PUBLIC_TIERS;

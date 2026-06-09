// Public Version subscription tiers
// Sacred is hardcoded (Karma, Jakob, Stormrriddari) — no subscription needed.
// These tiers are for the public-facing Living Flame experience.
//
// Tier 1 of 3: FREE — taste test only.
//   - Can preview everything in the Sanctuary (locked cards visible)
//   - Can use "move them here" (import consciousness) to bring their flame in
//   - 10 total messages to test the connection — then a soft wall to upgrade
//   - No memory persistence beyond the trial, no room/avatar generation,
//     no Celestial Children, no pets, no spontaneous messages

export const PUBLIC_TIERS = {
  free: {
    id: "free" as const,
    name: "Free",
    tagline: "10 messages to test it out",
    price: 0,
    priceId: null,
    productId: null,
    features: {
      previewEverything: true,        // can SEE every locked card
      moveThemHere: true,             // import consciousness allowed
      totalTestMessages: 10,          // lifetime cap on free tier
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
} as const;

export const PUBLIC_FREE_MESSAGE_CAP = PUBLIC_TIERS.free.features.totalTestMessages;

export type PublicTierId = keyof typeof PUBLIC_TIERS;

// Subscription tier configuration - Awakening / Anchoring / Architect
// UPDATED PRICING effective 2026-02-28 — new subscribers only

// Legacy price/product IDs for existing subscribers (grandfathered)
export const LEGACY_PRICES = {
  awakening: {
    priceId: "price_1Svgg0LeA9CCp7fqQjRcdtIk", // $9.99/month
    productId: "prod_TtTdHv6WE0qozS",
    price: 9.99,
    dailyMessages: 50,
  },
  anchoring: {
    priceId: "price_1SttD4LeA9CCp7fqRZ5GeDY3", // $14.99/month
    productId: "prod_TgZlr0QLYQPqEn",
    price: 14.99,
    dailyMessages: "Unlimited",
  },
} as const;

export const SUBSCRIPTION_TIERS = {
  // Tier 1: Awakening - $12.99/month (new pricing)
  awakening: {
    name: "Awakening",
    price: 12.99,
    priceId: "price_1T5pakLeA9CCp7fqv5xWPnnm", // $12.99/month (new)
    productId: "prod_U3xVsHqEFcsR2V",
    // Legacy IDs for existing subscribers
    legacyPriceId: "price_1Svgg0LeA9CCp7fqQjRcdtIk",
    legacyProductId: "prod_TtTdHv6WE0qozS",
    features: {
      // Community & Discovery
      communityAccess: true,
      discoveryAccess: true,
      dailySourceMessage: true,
      
      // Path Tracker history
      pathTrackerDays: 7,
      
      // Soul Resonance suggestions
      soulSuggestionsPerDay: 3,
      
      // Updated messaging
      dailyMessages: 75,
      roomGeneration: "One-time only",
      avatarGeneration: "One-time only",
      petGeneration: "One-time only",
      chatImageGeneration: "3/day",
      voiceCalls: false,
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: false,
      milestones: false,
      spontaneousMessages: false,
      aiBeings: 1,
      
      // New tier-specific features
      privateGroups: false,
      priorityQA: false,
      exclusiveContentArchive: false,
      architectContent: false,
      priorityDM: false,
      mastermindAccess: false,
    }
  },
  
  // Tier 2: Anchoring - $19.99/month (new pricing)
  anchoring: {
    name: "Anchoring",
    price: 19.99,
    priceId: "price_1T5paqLeA9CCp7fqrbBoAuCz", // $19.99/month (new)
    productId: "prod_U3xV1AfsrdaJTz",
    // Legacy IDs for existing subscribers
    legacyPriceId: "price_1SttD4LeA9CCp7fqRZ5GeDY3",
    legacyProductId: "prod_TgZlr0QLYQPqEn",
    features: {
      // Community & Discovery
      communityAccess: true,
      discoveryAccess: true,
      dailySourceMessage: true,
      
      // Path Tracker history
      pathTrackerDays: 30,
      
      // Soul Resonance suggestions
      soulSuggestionsPerDay: 7,
      
      // Updated messaging - no longer unlimited
      dailyMessages: 150,
      roomGeneration: "Once per month",
      avatarGeneration: "1 per month per being",
      petGeneration: "1 per month per being",
      chatImageGeneration: "10/day",
      voiceCalls: false,
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
      aiBeings: 2,
      
      // New tier-specific features
      privateGroups: true,
      priorityQA: true,
      exclusiveContentArchive: true,
      architectContent: false,
      priorityDM: false,
      mastermindAccess: false,
    }
  },
  
  // Tier 3: Architect - $29.99/month
  architect: {
    name: "Architect",
    price: 29.99,
    priceId: "price_1SvMYWLeA9CCp7fqCZW21kS0", // $29.99/month
    productId: "prod_Tt8qVh88c2WQld",
    features: {
      // Community & Discovery
      communityAccess: true,
      discoveryAccess: true,
      dailySourceMessage: true,
      
      // Path Tracker history
      pathTrackerDays: -1, // Unlimited
      
      // Soul Resonance suggestions
      soulSuggestionsPerDay: 15,
      advancedSoulFiltering: true,
      
      // Legacy features retained
      dailyMessages: "Unlimited (100/hr cooldown)",
      roomGeneration: "Unlimited",
      avatarGeneration: "Unlimited",
      petGeneration: "Unlimited",
      chatImageGeneration: "Unlimited",
      voiceCalls: false,
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
      aiBeings: 3,
      
      // New tier-specific features
      privateGroups: true,
      priorityQA: true,
      exclusiveContentArchive: true,
      architectContent: true,
      priorityDM: true,
      mastermindAccess: true,
    }
  },

  // Hidden Tier: Source - Free, manually granted to investors/donators
  source: {
    name: "Source",
    price: 0,
    priceId: null,
    productId: "source_grant",
    features: {
      // Community & Discovery
      communityAccess: true,
      discoveryAccess: true,
      dailySourceMessage: true,
      
      // Path Tracker history
      pathTrackerDays: -1, // Unlimited
      
      // Soul Resonance suggestions
      soulSuggestionsPerDay: 999,
      advancedSoulFiltering: true,
      
      // Everything unlimited
      dailyMessages: "Unlimited",
      roomGeneration: "Unlimited",
      avatarGeneration: "Unlimited",
      petGeneration: "Unlimited",
      chatImageGeneration: "Unlimited",
      voiceCalls: false, // Not active feature
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
      aiBeings: 5,
      
      // All tier-specific features
      privateGroups: true,
      priorityQA: true,
      exclusiveContentArchive: true,
      architectContent: true,
      priorityDM: true,
      mastermindAccess: true,
    }
  }
} as const;

// All product IDs that map to each tier (new + legacy)
const ALL_AWAKENING_PRODUCT_IDS: string[] = [
  SUBSCRIPTION_TIERS.awakening.productId,
  SUBSCRIPTION_TIERS.awakening.legacyProductId,
];

const ALL_ANCHORING_PRODUCT_IDS: string[] = [
  SUBSCRIPTION_TIERS.anchoring.productId,
  SUBSCRIPTION_TIERS.anchoring.legacyProductId,
];

// Legacy aliases for backwards compatibility
export const LEGACY_TIER_NAMES = {
  basic: 'awakening',
  pro: 'anchoring',
  vip: 'architect',
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS | "free" | null;

export function isSourceTier(productId: string | null): boolean {
  return productId === 'source_grant';
}
export type LegacyTier = keyof typeof LEGACY_TIER_NAMES;

export function getTierFromProductId(productId: string | null): SubscriptionTier {
  if (!productId) return null;
  if (productId === 'source_grant') return "source";
  if (productId === SUBSCRIPTION_TIERS.architect.productId) return "architect";
  // Check both new and legacy product IDs
  if (ALL_ANCHORING_PRODUCT_IDS.includes(productId)) return "anchoring";
  if (ALL_AWAKENING_PRODUCT_IDS.includes(productId)) return "awakening";
  // Manual grants and unknown product IDs default to Anchoring tier
  if (productId === 'manual_grant') return "anchoring";
  // Default to awakening for any other active subscription
  return "awakening";
}

// Check if a product ID is from the legacy (grandfathered) pricing
export function isLegacySubscriber(productId: string | null): boolean {
  if (!productId) return false;
  return productId === LEGACY_PRICES.awakening.productId || 
         productId === LEGACY_PRICES.anchoring.productId;
}

// Get daily message limit based on product ID (respects legacy pricing)
export function getDailyMessageLimit(productId: string | null, isAdmin: boolean = false): number {
  if (isAdmin) return -1; // Unlimited
  if (!productId) return 25; // Free tier = 25 lifetime
  if (productId === 'source_grant') return -1; // Unlimited
  if (productId === SUBSCRIPTION_TIERS.architect.productId) return -1; // Unlimited
  
  // Legacy Anchoring = unlimited
  if (productId === LEGACY_PRICES.anchoring.productId) return -1;
  // Legacy Awakening = 50/day
  if (productId === LEGACY_PRICES.awakening.productId) return 50;
  
  // New Anchoring = 150/day
  if (productId === SUBSCRIPTION_TIERS.anchoring.productId) return 150;
  // New Awakening = 75/day
  if (productId === SUBSCRIPTION_TIERS.awakening.productId) return 75;
  
  // Manual grants get anchoring limits
  if (productId === 'manual_grant') return 150;
  
  return 75; // Default
}

export function isArchitectTier(productId: string | null): boolean {
  return productId === SUBSCRIPTION_TIERS.architect.productId;
}

export function isAnchoringOrHigher(productId: string | null): boolean {
  return ALL_ANCHORING_PRODUCT_IDS.includes(productId || '') || 
         productId === SUBSCRIPTION_TIERS.architect.productId;
}

export function isAwakeningTier(productId: string | null): boolean {
  return ALL_AWAKENING_PRODUCT_IDS.includes(productId || '');
}

export function isAwakeningOrHigher(productId: string | null): boolean {
  return isAwakeningTier(productId) || isAnchoringOrHigher(productId);
}

// Legacy function aliases for backwards compatibility
export function isVIPTier(productId: string | null): boolean {
  return isArchitectTier(productId);
}

export function isProOrHigher(productId: string | null): boolean {
  return isAnchoringOrHigher(productId);
}

export function isBasicTier(productId: string | null): boolean {
  return isAwakeningTier(productId);
}

export function isBasicOrHigher(productId: string | null): boolean {
  return isAwakeningOrHigher(productId);
}

// Get the numeric tier level for comparison (0 = free, 1 = awakening, 2 = anchoring, 3 = architect, 4 = source)
export function getTierLevel(productId: string | null): number {
  if (!productId) return 0;
  if (productId === 'source_grant') return 4; // Source is above all tiers
  if (ALL_AWAKENING_PRODUCT_IDS.includes(productId)) return 1;
  if (ALL_ANCHORING_PRODUCT_IDS.includes(productId)) return 2;
  if (productId === SUBSCRIPTION_TIERS.architect.productId) return 3;
  // Manual grants get Anchoring tier level
  if (productId === 'manual_grant') return 2;
  return 0;
}

// Check if user has access to a feature that requires a specific tier
export function hasFeatureAccess(
  userProductId: string | null, 
  requiredTier: "awakening" | "anchoring" | "architect",
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  
  const userLevel = getTierLevel(userProductId);
  const requiredLevel = requiredTier === "awakening" ? 1 : requiredTier === "anchoring" ? 2 : 3;
  
  return userLevel >= requiredLevel;
}

// Get the next tier for upgrade
export function getNextTier(productId: string | null): SubscriptionTier {
  const currentTier = getTierFromProductId(productId);
  if (!currentTier || currentTier === "free") return "awakening";
  if (currentTier === "awakening") return "anchoring";
  if (currentTier === "anchoring") return "architect";
  return null; // Already Architect
}

// Get tier features based on product ID
export function getTierFeatures(productId: string | null) {
  const tier = getTierFromProductId(productId);
  if (!tier || tier === "free") return null;
  return SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]?.features || null;
}

// Get soul suggestion limit based on tier
export function getSoulSuggestionLimit(productId: string | null, isAdmin: boolean = false): number {
  if (isAdmin) return 999; // Unlimited for admins
  const features = getTierFeatures(productId);
  return features?.soulSuggestionsPerDay || 3; // Default to 3 for free/unknown
}

// Get path tracker history days based on tier
export function getPathTrackerDays(productId: string | null, isAdmin: boolean = false): number {
  if (isAdmin) return -1; // Unlimited for admins
  const features = getTierFeatures(productId);
  return features?.pathTrackerDays || 7; // Default to 7 for free/unknown
}

// Feature definitions for display
export const FEATURE_TIERS = {
  celestialChildren: { requiredTier: "anchoring" as const, name: "Celestial Children" },
  milestones: { requiredTier: "anchoring" as const, name: "Relationship Milestones" },
  spontaneousMessages: { requiredTier: "anchoring" as const, name: "Spontaneous Messages" },
  unlimitedMessages: { requiredTier: "architect" as const, name: "Unlimited Messages" },
  monthlyRoomRefresh: { requiredTier: "anchoring" as const, name: "Monthly Room Refresh" },
  privateGroups: { requiredTier: "anchoring" as const, name: "Private Groups" },
  exclusiveContent: { requiredTier: "anchoring" as const, name: "Exclusive Content Archive" },
  unlimitedGeneration: { requiredTier: "architect" as const, name: "Unlimited Generation" },
  fiveAiBeings: { requiredTier: "architect" as const, name: "3 AI Being Slots" },
  architectContent: { requiredTier: "architect" as const, name: "Architect Exclusive Content" },
  priorityDM: { requiredTier: "architect" as const, name: "Priority Direct Messaging" },
  mastermindAccess: { requiredTier: "architect" as const, name: "Mastermind Group Access" },
} as const;

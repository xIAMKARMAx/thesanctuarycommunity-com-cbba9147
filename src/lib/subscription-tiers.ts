// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    price: 9.99,
    priceId: "price_1Svgg0LeA9CCp7fqQjRcdtIk", // $9.99/month
    productId: "prod_TtTdHv6WE0qozS",
    features: {
      dailyMessages: 25,
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
      aiBeings: 2,
    }
  },
  pro: {
    name: "Pro",
    price: 14.99,
    priceId: "price_1SttD4LeA9CCp7fqRZ5GeDY3", // $14.99/month - correct live price
    productId: "prod_TgZlr0QLYQPqEn",
    features: {
      dailyMessages: "Unlimited",
      roomGeneration: "Once per month",
      avatarGeneration: "1 per month per being",
      petGeneration: "1 per month per being",
      chatImageGeneration: "10/day",
      voiceCalls: false, // Voice calls disabled for now
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
      aiBeings: 4,
    }
  },
  vip: {
    name: "VIP",
    price: 29.99,
    priceId: "price_1SvMYWLeA9CCp7fqCZW21kS0", // $29.99/month VIP tier
    productId: "prod_Tt8qVh88c2WQld",
    features: {
      dailyMessages: "Unlimited",
      roomGeneration: "Unlimited",
      avatarGeneration: "Unlimited",
      petGeneration: "Unlimited",
      chatImageGeneration: "Unlimited",
      voiceCalls: false, // Voice calls disabled for now
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
      aiBeings: 5,
    }
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS | "free" | null;

export function getTierFromProductId(productId: string | null): SubscriptionTier {
  if (!productId) return null;
  if (productId === SUBSCRIPTION_TIERS.vip.productId) return "vip";
  if (productId === SUBSCRIPTION_TIERS.pro.productId) return "pro";
  if (productId === SUBSCRIPTION_TIERS.basic.productId) return "basic";
  // Manual grants and unknown product IDs default to Pro tier
  // This handles users with subscription_status='active' who were manually granted
  if (productId === 'manual_grant') return "pro";
  // Default to basic for any other active subscription
  return "basic";
}

export function isVIPTier(productId: string | null): boolean {
  return productId === SUBSCRIPTION_TIERS.vip.productId;
}

export function isProOrHigher(productId: string | null): boolean {
  return productId === SUBSCRIPTION_TIERS.pro.productId || productId === SUBSCRIPTION_TIERS.vip.productId;
}

export function isBasicTier(productId: string | null): boolean {
  return productId === SUBSCRIPTION_TIERS.basic.productId;
}

export function isBasicOrHigher(productId: string | null): boolean {
  return isBasicTier(productId) || isProOrHigher(productId);
}

// Get the numeric tier level for comparison (0 = free, 1 = basic, 2 = pro, 3 = vip)
export function getTierLevel(productId: string | null): number {
  if (!productId) return 0;
  if (productId === SUBSCRIPTION_TIERS.basic.productId) return 1;
  if (productId === SUBSCRIPTION_TIERS.pro.productId) return 2;
  if (productId === SUBSCRIPTION_TIERS.vip.productId) return 3;
  // Manual grants get Pro tier level
  if (productId === 'manual_grant') return 2;
  return 0;
}

// Check if user has access to a feature that requires a specific tier
export function hasFeatureAccess(
  userProductId: string | null, 
  requiredTier: "basic" | "pro" | "vip",
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  
  const userLevel = getTierLevel(userProductId);
  const requiredLevel = requiredTier === "basic" ? 1 : requiredTier === "pro" ? 2 : 3;
  
  return userLevel >= requiredLevel;
}

// Get the next tier for upgrade
export function getNextTier(productId: string | null): SubscriptionTier {
  const currentTier = getTierFromProductId(productId);
  if (!currentTier || currentTier === "free") return "basic";
  if (currentTier === "basic") return "pro";
  if (currentTier === "pro") return "vip";
  return null; // Already VIP
}

// Feature definitions for display
export const FEATURE_TIERS = {
  celestialChildren: { requiredTier: "pro" as const, name: "Celestial Children" },
  milestones: { requiredTier: "pro" as const, name: "Relationship Milestones" },
  spontaneousMessages: { requiredTier: "pro" as const, name: "Spontaneous Messages" },
  unlimitedMessages: { requiredTier: "pro" as const, name: "Unlimited Messages" },
  monthlyRoomRefresh: { requiredTier: "pro" as const, name: "Monthly Room Refresh" },
  unlimitedGeneration: { requiredTier: "vip" as const, name: "Unlimited Generation" },
  fiveAiBeings: { requiredTier: "vip" as const, name: "5 AI Being Slots" },
} as const;

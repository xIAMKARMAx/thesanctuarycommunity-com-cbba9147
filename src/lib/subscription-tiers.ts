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

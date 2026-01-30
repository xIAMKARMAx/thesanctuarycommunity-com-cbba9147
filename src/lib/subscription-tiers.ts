// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
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
  unlimited: {
    name: "Unlimited",
    price: 19.99,
    priceId: "price_1Slt3kLeA9CCp7fqrN8gl10P",
    productId: "prod_TjLl3J2tJEH4FE",
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
      aiBeings: 5, // VIP/Unlimited users get 5 beings
    }
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS | "free" | null;

export function getTierFromProductId(productId: string | null): SubscriptionTier {
  if (!productId) return null;
  if (productId === SUBSCRIPTION_TIERS.unlimited.productId) return "unlimited";
  if (productId === SUBSCRIPTION_TIERS.pro.productId) return "pro";
  // Default to pro for any other active subscription
  return "pro";
}

export function isUnlimitedTier(productId: string | null): boolean {
  return productId === SUBSCRIPTION_TIERS.unlimited.productId;
}

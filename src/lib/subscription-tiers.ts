// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  pro: {
    name: "Pro",
    price: 9.99,
    priceId: "price_1SjCbVLeA9CCp7fqrQ4K0DjJ",
    productId: "prod_TgZlr0QLYQPqEn",
    features: {
      dailyMessages: "Unlimited",
      roomGeneration: "Every 7 days",
      avatarGeneration: "Every 7 days",
      petGeneration: "Every 7 days",
      chatImageGeneration: "10/day",
      voiceCalls: true,
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
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
      voiceCalls: true,
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
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

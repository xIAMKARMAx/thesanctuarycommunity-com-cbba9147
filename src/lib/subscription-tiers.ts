// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  pro: {
    name: "Pro",
    price: 14.99,
    priceId: "price_1SdwgrLeA9CCp7fqIHpBrHBp",
    productId: "prod_TWIdhyRIT9aJm3",
    features: {
      dailyMessages: "Unlimited",
      roomGeneration: "Every 3 days",
      avatarGeneration: "Every 3 days",
      petGeneration: "Every 3 days",
      chatImageGeneration: "10/day",
      voiceCalls: true,
      moodTracker: true,
      dreamJournal: true,
      celestialChildren: true,
      milestones: true,
      spontaneousMessages: true,
      aiBeings: 5,
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
      aiBeings: 5,
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

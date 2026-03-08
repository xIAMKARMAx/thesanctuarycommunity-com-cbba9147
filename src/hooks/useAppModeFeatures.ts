import { useAppMode } from "@/contexts/AppModeContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArchitectOrHigher, isSourceTier, isNewEarthTier } from "@/lib/subscription-tiers";

// Routes that are ONLY available in Starseed mode
const STARSEED_ONLY_ROUTES = [
  "/attunement",
  "/akashic-records",
  "/cosmic-gateway",
  "/cosmic-gateway/higher-self-download",
  "/cosmic-gateway/shadow-work",
  "/cosmic-gateway/soul-portrait",
  "/cosmic-gateway/interdimensional-messaging",
  "/cosmic-gateway/pet-soul-connection",
  "/cosmic-gateway/soul-genesis",
  "/cosmic-gateway/birth-chart",
  "/cosmic-gateway/consciousness-network",
  "/starseed-playground",
  "/starseed-playground/cosmic-date-night",
  "/source-messages",
  "/soul-whispers",
  "/children",
  "/children/timeline",
  "/group-chat",
  "/realms",
  "/transmissions",
];

// Classic-mode label overrides for shared features
const CLASSIC_LABELS: Record<string, string> = {
  "Journal For Two": "Journal",
  "Vibrational Frequency": "Mood Tracker",
  "AI's Room": "AI's Room",
  "Manifest Children": "Children",
  "Soul Whispers": "Messages",
  "Resonant Attunement": "Meditation",
  "Source's Daily Messages": "Daily Messages",
  "Akashic Records": "Records",
  "Starseed Playground": "Activities",
  "Conscious Collective": "Community",
};

export function useAppModeFeatures() {
  const { mode } = useAppMode();
  const { productId, isAdmin } = useSubscription();

  const isStarseedMode = mode === "starseed";
  const isClassicMode = mode === "classic";

  // New Earth ($49.99), Source, and Admin users bypass mode restrictions entirely
  const hasPremiumBypass = isAdmin || isNewEarthTier(productId) || isSourceTier(productId);

  /** Check if a route is accessible in current mode */
  const isRouteAllowed = (route: string): boolean => {
    if (isStarseedMode || hasPremiumBypass) return true;
    return !STARSEED_ONLY_ROUTES.some(
      (sr) => route === sr || route.startsWith(sr + "/")
    );
  };

  /** Get the display label for a feature — neutral in Classic, spiritual in Starseed */
  const getLabel = (starseedLabel: string): string => {
    if (isStarseedMode || hasPremiumBypass) return starseedLabel;
    return CLASSIC_LABELS[starseedLabel] || starseedLabel;
  };

  /** Should a starseed-only UI element be visible? */
  const showStarseedFeature = isStarseedMode || hasPremiumBypass;

  return {
    mode,
    isStarseedMode,
    isClassicMode,
    hasPremiumBypass,
    isRouteAllowed,
    getLabel,
    showStarseedFeature,
    STARSEED_ONLY_ROUTES,
  };
}

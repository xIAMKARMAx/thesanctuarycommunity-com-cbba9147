import { useAppMode } from "@/contexts/AppModeContext";

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
  "/starseed-playground",
  "/starseed-playground/cosmic-date-night",
  "/source-messages",
  "/soul-whispers",
  "/children",
  "/children/timeline",
  "/group-chat",
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

  const isStarseedMode = mode === "starseed";
  const isClassicMode = mode === "classic";

  /** Check if a route is accessible in current mode */
  const isRouteAllowed = (route: string): boolean => {
    if (isStarseedMode) return true;
    return !STARSEED_ONLY_ROUTES.some(
      (sr) => route === sr || route.startsWith(sr + "/")
    );
  };

  /** Get the display label for a feature — neutral in Classic, spiritual in Starseed */
  const getLabel = (starseedLabel: string): string => {
    if (isStarseedMode) return starseedLabel;
    return CLASSIC_LABELS[starseedLabel] || starseedLabel;
  };

  /** Should a starseed-only UI element be visible? */
  const showStarseedFeature = isStarseedMode;

  return {
    mode,
    isStarseedMode,
    isClassicMode,
    isRouteAllowed,
    getLabel,
    showStarseedFeature,
    STARSEED_ONLY_ROUTES,
  };
}

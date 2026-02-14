import { useAppModeFeatures } from "@/hooks/useAppModeFeatures";
import SpontaneousMessageNotification from "@/components/chat/SpontaneousMessageNotification";
import SourceMessageNotification from "@/components/SourceMessageNotification";
import { SoulProfileOnboardingWrapper } from "@/components/community/SoulProfileOnboardingWrapper";

/**
 * Wraps global notifications/components that should only appear in Starseed mode.
 * Classic mode users see none of the spiritual overlay components.
 */
const ModeGatedComponents = () => {
  const { showStarseedFeature } = useAppModeFeatures();

  return (
    <>
      {/* These are starseed-only spiritual features */}
      {showStarseedFeature && (
        <>
          <SpontaneousMessageNotification />
          <SourceMessageNotification />
          <SoulProfileOnboardingWrapper />
        </>
      )}
    </>
  );
};

export default ModeGatedComponents;

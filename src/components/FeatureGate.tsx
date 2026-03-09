import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  children: ReactNode;
  /** Minimum subscription tier required */
  requiredTier?: "awakening" | "anchoring" | "architect";
  /** Feature name displayed in the overlay */
  featureName: string;
  /** Description of what the feature does */
  featureDescription: string;
  /** What tier unlocks this feature */
  tierLabel?: string;
  /** List of things this feature includes */
  highlights?: string[];
  /** Allow community/social features for free users */
  allowFree?: boolean;
}

export const FeatureGate = ({
  children,
  requiredTier = "awakening",
  featureName,
  featureDescription,
  tierLabel,
  highlights = [],
  allowFree = false,
}: FeatureGateProps) => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, currentTier, hasAccess } = useSubscription();

  // Admin and source always pass
  if (isAdmin || currentTier === "source") return <>{children}</>;

  // If explicitly allowed for free users
  if (allowFree) return <>{children}</>;

  // Check if user has sufficient tier
  if (isSubscribed && hasAccess(requiredTier)) return <>{children}</>;

  const displayTier = tierLabel || (requiredTier === "awakening" ? "Awakening" : requiredTier === "anchoring" ? "Anchoring" : "Architect");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred background - renders children but blurs them */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="filter blur-md brightness-50 pointer-events-none scale-105">
          {children}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10" />

      {/* Content overlay card */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          {/* Feature name */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{featureName}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {featureDescription}
            </p>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="bg-card/80 backdrop-blur rounded-xl border border-border p-4 space-y-2 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                What you'll unlock
              </p>
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tier badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Available with {displayTier}+ subscription
            </span>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/pricing")}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Choose Your Frequency
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="w-full text-muted-foreground"
            >
              Go Back
            </Button>
          </div>

          {/* Trial note */}
          <p className="text-xs text-muted-foreground">
            Every subscription includes a 3-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureGate;

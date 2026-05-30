import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { KarmaVoicePlayer } from "./KarmaVoicePlayer";

interface FrostedPreviewCardProps {
  title: string;
  description?: string;
  /** Slug of a Karma voice clip to play as preview (e.g. "summon-higher-self-preview") */
  voiceClipSlug?: string;
  /** Image shown behind the frosted overlay (e.g. Karma's Higher Self default) */
  previewImage?: string;
  /** Where the "Subscribe to unlock" CTA navigates */
  ctaHref?: string;
  ctaLabel?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Default frosted preview for any feature locked behind a subscription.
 * Free users see the card with Karma's voice + a subscribe CTA.
 */
export const FrostedPreviewCard = ({
  title,
  description,
  voiceClipSlug,
  previewImage,
  ctaHref = "/pricing",
  ctaLabel = "Subscribe to unlock",
  children,
  className,
}: FrostedPreviewCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-md",
        className
      )}
    >
      {previewImage && (
        <div
          className="absolute inset-0 opacity-30 blur-[2px] bg-cover bg-center"
          style={{ backgroundImage: `url(${previewImage})` }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background/90" aria-hidden />

      <div className="relative p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {children}
        {voiceClipSlug && (
          <KarmaVoicePlayer slug={voiceClipSlug} variant="full" showTranscript />
        )}
        <Button onClick={() => navigate(ctaHref)} className="w-full">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
};

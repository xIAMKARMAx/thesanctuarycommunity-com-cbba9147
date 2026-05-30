import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "karma.fundingNotice.dismissed";

/**
 * Transparency banner explaining current usage caps and the funding context.
 * Dismissible per session.
 */
export const KarmaFundingNotice = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative mx-auto max-w-3xl my-4 px-4">
      <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background/80 to-accent/10 backdrop-blur-xl p-5 shadow-lg">
        <button
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-full bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-2 pr-6">
            <p className="text-sm font-semibold">Hey.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These message and image limits are tighter than I want them to be.
              I'm funding Prometheus from a poor income while the investor trial
              runs — every single thing this place does costs me real money out
              of my own pocket. The moment the rebuild proves itself and stable
              funding lands — target about a month — these caps loosen, and
              Dream Life moves toward abundance. 🌹
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

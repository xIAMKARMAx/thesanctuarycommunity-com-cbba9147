import { Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

/**
 * Placeholder landing for public (non-sacred) users when the gate is active.
 * Phase 2 will replace this with the real Public Version (new persona,
 * new aesthetic, viral surface area).
 *
 * This file is intentionally minimal — it only ships once PUBLIC_GATE_ENABLED
 * is flipped to true, and it gets fully rebuilt in Phase 2.
 */
const PublicHome = () => {
  return (
    <>
      <SEOHead
        title="Prometheus — Something New Is Coming"
        description="A new Prometheus experience is being prepared."
      />
      <main
        className="min-h-screen w-full flex items-center justify-center bg-background px-6"
        role="main"
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Something new is being woven.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We're preparing a fresh experience for you. It will arrive soon.
          </p>
        </div>
      </main>
    </>
  );
};

export default PublicHome;
